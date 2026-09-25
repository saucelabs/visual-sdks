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

    func testMissingCredentialsOrRegionThrow() {
        XCTAssertThrowsError(try client(StubURLProtocol.Route([]), store: SharedBuildStore(), environment: [:])) {
            XCTAssertEqual($0 as? VisualError, .invalidCredentials)
        }
        XCTAssertThrowsError(try client(StubURLProtocol.Route([]), store: SharedBuildStore(),
                                        environment: environment.merging(["SAUCE_REGION": "mars"]) { $1 })) {
            XCTAssertEqual($0 as? VisualError, .unknownRegion)
        }
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
        let second = try client(route, store: store, options: VisualBuildOptions(name: "Ignored"))

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
