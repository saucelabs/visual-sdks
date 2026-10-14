import Foundation
import XCTest
// Release runs need `-Xswiftc -enable-testing` for this import.
@testable import SauceVisual

// Test-only: no mutable instance state, XCTest owns its synchronization.
final class VisualClientTests: XCTestCase, @unchecked Sendable {
    private let buildID = "0f8fad5b-d9cb-469f-a165-70867728950e"
    private let environment = ["SAUCE_USERNAME": "user", "SAUCE_ACCESS_KEY": "super-secret", "SAUCE_REGION": "staging"]

    private var created: StubURLProtocol.Reply {
        .json(["data": ["result": ["id": buildID, "name": "Build", "status": "RUNNING", "url": "http://build"]]])
    }

    private var finished: StubURLProtocol.Reply {
        .json(["data": ["result": ["id": buildID, "name": "Build", "status": "EQUAL", "url": "http://build"]]])
    }

    private func client(
        _ route: StubURLProtocol.Route,
        store: SharedBuildStore,
        options: VisualBuildOptions = VisualBuildOptions(name: "Build"),
        environment: [String: String]? = nil
    ) throws -> VisualClient {
        try VisualClient(
            credentials: nil, region: nil, options: options, session: StubURLProtocol.session(route),
            environment: environment ?? self.environment, store: store
        )
    }

    func testConfigurationComesFromEnvironment() throws {
        let client = try client(StubURLProtocol.Route([]), store: SharedBuildStore(), options: VisualBuildOptions(),
                                environment: environment.merging(["SAUCE_VISUAL_PROJECT": "Env project"]) { $1 })
        XCTAssertEqual(client.region, .staging)
        XCTAssertEqual(client.options.project, "Env project")
    }

    func testInvalidBuildIdFailsAtInit() {
        XCTAssertThrowsError(try client(StubURLProtocol.Route([]), store: SharedBuildStore(),
                                        options: VisualBuildOptions(buildId: "not-a-uuid"))) {
            XCTAssertEqual($0 as? VisualError, .invalidBuildId)
        }
    }

    func testConcurrentCallsAcrossClientsShareOneBuild() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([created])
        let first = try client(route, store: store)
        let second = try client(route, store: store)

        let builds = try await withThrowingTaskGroup(of: VisualBuild.self) { group in
            for index in 0..<20 {
                let client = index.isMultiple(of: 2) ? first : second
                group.addTask { try await client.build() }
            }
            return try await group.reduce(into: []) { $0.append($1) }
        }

        XCTAssertEqual(Set(builds.map(\.id)), [buildID])
        XCTAssertEqual(route.requests.count, 1)
    }

    func testMatchingClientsUseTheOwnersConnection() async throws {
        let store = SharedBuildStore()
        let owner = StubURLProtocol.Route([created, finished])
        let other = StubURLProtocol.Route([])
        let first = try client(owner, store: store)
        // Same configuration on a different URLSession: shares the build, not a conflict.
        let second = try client(other, store: store)

        _ = try await first.build()
        let shared = try await second.build()
        let finishedBuild = try await second.finish()
        XCTAssertEqual(shared.id, buildID)
        XCTAssertEqual(finishedBuild.status, "EQUAL")
        XCTAssertEqual(owner.requests.count, 2)
        XCTAssertEqual(other.requests.count, 0, "The second client's session is never used")
    }

    func testConflictingConfigurationsAreRejected() async throws {
        let conflicts: [(String, VisualBuildOptions, [String: String])] = [
            ("build options", VisualBuildOptions(name: "Other build"), environment),
            ("credentials", VisualBuildOptions(name: "Build"), environment.merging(["SAUCE_ACCESS_KEY": "other-key"]) { $1 }),
            ("region", VisualBuildOptions(name: "Build"), environment.merging(["SAUCE_REGION": "us-west-1"]) { $1 })
        ]
        for (label, options, environment) in conflicts {
            let store = SharedBuildStore()
            let route = StubURLProtocol.Route([created])
            let other = StubURLProtocol.Route([])
            _ = try await client(route, store: store).build()
            let conflicting = try client(other, store: store, options: options, environment: environment)

            await XCTAssertThrowsErrorAsync(try await conflicting.build()) {
                XCTAssertEqual($0 as? VisualError, .conflictingConfiguration, label)
            }
            await XCTAssertThrowsErrorAsync(try await conflicting.finish()) {
                XCTAssertEqual($0 as? VisualError, .conflictingConfiguration, label)
            }
            XCTAssertEqual(other.requests.count, 0, label)
        }
    }

    func testFailedCreationReleasesTheConfiguration() async throws {
        let store = SharedBuildStore()
        let failing = try client(StubURLProtocol.Route([.failure(.cannotConnectToHost)]), store: store)
        let route = StubURLProtocol.Route([created])
        let other = try client(route, store: store, options: VisualBuildOptions(name: "Other build"))

        await XCTAssertThrowsErrorAsync(try await failing.build()) {
            XCTAssertEqual(($0 as? VisualAPIError)?.code, .networkFailure)
        }
        let build = try await other.build()
        XCTAssertEqual(build.id, buildID)
    }

    func testFailedCreationIsRetried() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([.failure(.cannotConnectToHost), created])
        let client = try client(route, store: store)

        await XCTAssertThrowsErrorAsync(try await client.build()) {
            XCTAssertEqual(($0 as? VisualAPIError)?.code, .networkFailure)
        }
        let build = try await client.build()
        XCTAssertEqual(build.id, buildID)
        XCTAssertEqual(route.requests.count, 2)
    }

    func testFinishIsIdempotentAndClosesTheBuild() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([created, finished])
        let client = try client(route, store: store)

        _ = try await client.build()
        let results = try await withThrowingTaskGroup(of: VisualBuild.self) { group in
            for _ in 0..<10 { group.addTask { try await client.finish() } }
            return try await group.reduce(into: []) { $0.append($1) }
        }

        XCTAssertEqual(Set(results.map(\.status)), ["EQUAL"])
        XCTAssertEqual(route.requests.count, 2)
        await XCTAssertThrowsErrorAsync(try await client.build()) {
            XCTAssertEqual($0 as? VisualError, .buildAlreadyCompleted)
        }
    }

    func testFinishWithoutBuildCreatesThenFinishes() async throws {
        let route = StubURLProtocol.Route([created, finished])
        let finishedBuild = try await client(route, store: SharedBuildStore()).finish()

        XCTAssertEqual(finishedBuild.status, "EQUAL")
        XCTAssertTrue((route.bodies[0]["query"] as? String)?.contains("createBuild") == true)
        XCTAssertTrue((route.bodies[1]["query"] as? String)?.contains("finishBuild") == true)
    }

    func testFailedFinishCanBeRetried() async throws {
        let route = StubURLProtocol.Route([created, .failure(.timedOut), finished])
        let client = try client(route, store: SharedBuildStore())

        await XCTAssertThrowsErrorAsync(try await client.finish()) {
            XCTAssertEqual(($0 as? VisualAPIError)?.code, .networkFailure)
        }
        let finishedBuild = try await client.finish()
        XCTAssertEqual(finishedBuild.status, "EQUAL")
        XCTAssertEqual(route.requests.count, 3)
    }
}
