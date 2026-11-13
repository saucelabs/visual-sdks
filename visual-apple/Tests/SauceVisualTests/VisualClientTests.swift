import Foundation
import XCTest
// Release runs need `-Xswiftc -enable-testing` for this import.
@testable import SauceVisual

// `@unchecked Sendable` is safe: the tests keep no shared state.
final class VisualClientTests: XCTestCase, @unchecked Sendable {
    private let buildID = "0f8fad5b-d9cb-469f-a165-70867728950e"
    private let environment = ["SAUCE_USERNAME": "user", "SAUCE_ACCESS_KEY": "super-secret", "SAUCE_REGION": "staging"]

    private var created: StubURLProtocol.Reply {
        .json(["data": ["result": ["id": buildID, "name": "Build", "status": "RUNNING", "url": "http://build"]]])
    }

    private var finished: StubURLProtocol.Reply {
        .json(["data": ["result": ["id": buildID, "name": "Build", "status": "EQUAL", "url": "http://build"]]])
    }

    /// The build as a lookup returns it, with `mode` saying whether it is still running.
    private func lookup(mode: String, status: String = "RUNNING") -> StubURLProtocol.Reply {
        .json(["data": ["result": [
            "id": buildID, "name": "Build", "status": status, "url": "http://build", "mode": mode, "customId": "run-1"
        ]]])
    }

    private var miss: StubURLProtocol.Reply { .json(["data": ["result": NSNull()]]) }

    /// The operations sent, in order, for example `["createBuild", "finishBuild"]`.
    private func operations(_ route: StubURLProtocol.Route) -> [String] {
        route.bodies.compactMap { body in
            (body["query"] as? String)?.split { !$0.isLetter }.dropFirst().first.map(String.init)
        }
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

    func testInvalidFinishDelayFailsAtInit() {
        let invalid: [(String, VisualBuildOptions)] = [
            ("no custom ID", VisualBuildOptions(finishDelay: 10)),
            ("build ID only", VisualBuildOptions(buildId: buildID, finishDelay: 10)),
            ("negative", VisualBuildOptions(customId: "ci-42", finishDelay: -1)),
            ("not a number", VisualBuildOptions(customId: "ci-42", finishDelay: .nan)),
            ("infinite", VisualBuildOptions(customId: "ci-42", finishDelay: .infinity)),
            ("too large", VisualBuildOptions(customId: "ci-42", finishDelay: 3_000_000_000))
        ]
        for (label, options) in invalid {
            XCTAssertThrowsError(try client(StubURLProtocol.Route([]), store: SharedBuildStore(), options: options), label) {
                XCTAssertEqual($0 as? VisualError, .invalidFinishDelay, label)
            }
        }
        XCTAssertNoThrow(try client(StubURLProtocol.Route([]), store: SharedBuildStore(),
                                    options: VisualBuildOptions(customId: "ci-42", finishDelay: 0)))
        // The custom ID may come from the environment.
        XCTAssertNoThrow(try client(StubURLProtocol.Route([]), store: SharedBuildStore(),
                                    options: VisualBuildOptions(finishDelay: 60),
                                    environment: environment.merging(["SAUCE_VISUAL_CUSTOM_ID": "ci-42"]) { $1 }))
    }

    func testBuildIdSpellingsShareOneBuild() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([lookup(mode: "RUNNING")])
        let upper = try client(route, store: store, options: VisualBuildOptions(buildId: buildID.uppercased()))
        let lower = try client(StubURLProtocol.Route([]), store: store, options: VisualBuildOptions(buildId: buildID))

        XCTAssertEqual(upper.options.buildId, buildID)
        let first = try await upper.build()
        let second = try await lower.build()
        XCTAssertEqual(first.id, second.id)
        XCTAssertEqual(route.requests.count, 1)
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
        let other = try self.client(route, store: store, options: VisualBuildOptions(name: "Other build"))

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

    // MARK: - Cancellation

    func testPreCancelledCallerStartsNothing() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([created])
        let client = try client(route, store: store)

        let build = await Task {
            withUnsafeCurrentTask { $0?.cancel() }
            return try await client.build()
        }.result
        let finish = await Task {
            withUnsafeCurrentTask { $0?.cancel() }
            return try await client.finish()
        }.result

        for result in [build, finish] {
            XCTAssertThrowsError(try result.get()) { XCTAssertTrue($0 is CancellationError, "\($0)") }
        }
        XCTAssertEqual(route.requests.count, 0)
        // Nothing was bound or closed, so another configuration can still create the build.
        let other = try self.client(route, store: store, options: VisualBuildOptions(name: "Other build"))
        let created = try await other.build()
        XCTAssertEqual(created.id, buildID)
    }

    func testCancelledWaiterDoesNotCancelTheSharedCreation() async throws {
        let route = StubURLProtocol.Route([created.delayed(by: 0.5)])
        let client = try client(route, store: SharedBuildStore())

        let waiters = (0..<4).map { _ in Task { try await client.build() } }
        let cancelled = Task { try await client.build() }
        // Cancel one caller once every caller is waiting on the request in flight.
        while route.requests.isEmpty { try await Task.sleep(nanoseconds: 10_000_000) }
        try await Task.sleep(nanoseconds: 100_000_000)
        cancelled.cancel()

        let result = await cancelled.result
        XCTAssertThrowsError(try result.get()) { XCTAssertTrue($0 is CancellationError, "\($0)") }
        for waiter in waiters {
            let build = try await waiter.value
            XCTAssertEqual(build.id, buildID)
        }
        XCTAssertEqual(route.requests.count, 1)
    }

    // MARK: - Creation whose outcome is unknown

    func testUncertainCreationNeverCreatesASecondBuild() async throws {
        let uncertain: [(String, StubURLProtocol.Reply)] = [
            // The service creates the build, then the response is lost on the way back.
            ("connection lost", .failure(.networkConnectionLost)),
            ("timeout", .failure(.timedOut)),
            ("server error", StubURLProtocol.Reply(status: 502, body: Data()))
        ]
        for (label, reply) in uncertain {
            let store = SharedBuildStore()
            let route = StubURLProtocol.Route([reply])
            let client = try client(route, store: store)

            var first: Error?
            await XCTAssertThrowsErrorAsync(try await client.build()) { first = $0 }
            // Later calls get the same failure without another request.
            await XCTAssertThrowsErrorAsync(try await client.build()) {
                XCTAssertEqual($0 as? VisualAPIError, first as? VisualAPIError, label)
            }
            guard case .failed = await store.finishOwnedBuild() else { return XCTFail("Expected the failure: \(label)") }
            // The configuration stays bound, so another one can't create a build either.
            let other = try self.client(StubURLProtocol.Route([created]), store: store, options: VisualBuildOptions(name: "Other build"))
            await XCTAssertThrowsErrorAsync(try await other.build()) {
                XCTAssertEqual($0 as? VisualError, .conflictingConfiguration, label)
            }
            XCTAssertEqual(operations(route), ["createBuild"], label)
        }
    }

    func testLostCreateResponseWithCustomIdIsFoundByLookup() async throws {
        let options = VisualBuildOptions(name: "Build", customId: "run-1")
        // The lookup misses, the service creates the build, then the response is lost on the way back.
        let route = StubURLProtocol.Route([miss, .failure(.networkConnectionLost), lookup(mode: "RUNNING")])
        let client = try client(route, store: SharedBuildStore(), options: options)

        await XCTAssertThrowsErrorAsync(try await client.build()) {
            XCTAssertEqual(($0 as? VisualAPIError)?.code, .networkFailure)
        }
        let build = try await client.build()
        XCTAssertEqual(build.id, buildID)
        XCTAssertEqual(operations(route), ["buildByCustomId", "createBuild", "buildByCustomId"])
    }

    func testUncertainCreationWithCustomIdIsNotCreatedAgainWhenNotFound() async throws {
        let store = SharedBuildStore()
        let options = VisualBuildOptions(name: "Build", customId: "run-1")
        let route = StubURLProtocol.Route([miss, .failure(.timedOut), miss])
        let client = try client(route, store: store, options: options)

        for _ in 0..<2 {
            await XCTAssertThrowsErrorAsync(try await client.build()) {
                XCTAssertEqual(($0 as? VisualAPIError)?.detail, "The request timed out.")
            }
        }
        let other = try self.client(StubURLProtocol.Route([created]), store: store, options: VisualBuildOptions(name: "Other build"))
        await XCTAssertThrowsErrorAsync(try await other.build()) {
            XCTAssertEqual($0 as? VisualError, .conflictingConfiguration)
        }
        XCTAssertEqual(operations(route), ["buildByCustomId", "createBuild", "buildByCustomId"])
    }

    // MARK: - Finishing

    func testFailedFinishKeepsAdmissionClosedAndIsRetried() async throws {
        // The request never reached the service, so it is sent again as it was.
        let route = StubURLProtocol.Route([created, .failure(.cannotConnectToHost), finished])
        let client = try client(route, store: SharedBuildStore())

        await XCTAssertThrowsErrorAsync(try await client.finish()) {
            XCTAssertEqual(($0 as? VisualAPIError)?.code, .networkFailure)
        }
        await XCTAssertThrowsErrorAsync(try await client.build()) {
            XCTAssertEqual($0 as? VisualError, .buildAlreadyCompleted)
        }
        let finishedBuild = try await client.finish()
        XCTAssertEqual(finishedBuild.status, "EQUAL")
        XCTAssertEqual(operations(route), ["createBuild", "finishBuild", "finishBuild"])
    }

    func testLostFinishResponseIsReconciledInsteadOfResent() async throws {
        // The service finishes the build, then the response is lost on the way back.
        let route = StubURLProtocol.Route([created, .failure(.networkConnectionLost), lookup(mode: "COMPLETED", status: "EQUAL")])
        let client = try client(route, store: SharedBuildStore())

        await XCTAssertThrowsErrorAsync(try await client.finish()) {
            XCTAssertEqual(($0 as? VisualAPIError)?.code, .networkFailure)
        }
        await XCTAssertThrowsErrorAsync(try await client.build()) {
            XCTAssertEqual($0 as? VisualError, .buildAlreadyCompleted)
        }
        let finishedBuild = try await client.finish()
        XCTAssertEqual(finishedBuild.status, "EQUAL")
        XCTAssertEqual(operations(route), ["createBuild", "finishBuild", "build"])
    }

    func testUncertainFinishIsSentAgainWhileTheBuildIsStillRunning() async throws {
        let route = StubURLProtocol.Route([created, .failure(.timedOut), lookup(mode: "RUNNING"), finished])
        let client = try client(route, store: SharedBuildStore())

        await XCTAssertThrowsErrorAsync(try await client.finish())
        let finishedBuild = try await client.finish()
        XCTAssertEqual(finishedBuild.status, "EQUAL")
        XCTAssertEqual(operations(route), ["createBuild", "finishBuild", "build", "finishBuild"])
    }

    func testUncertainDelayedFinishIsSentAgainWithTheDelay() async throws {
        // A delayed finish leaves the build running, so after a timeout it is sent again, which only restarts the delay.
        let route = StubURLProtocol.Route([lookup(mode: "RUNNING"), .failure(.timedOut), lookup(mode: "RUNNING"), created])
        let client = try client(route, store: SharedBuildStore(), options: VisualBuildOptions(customId: "run-1", finishDelay: 60))

        await XCTAssertThrowsErrorAsync(try await client.finish())
        _ = try await client.finish()
        XCTAssertEqual(operations(route), ["buildByCustomId", "finishBuild", "build", "finishBuild"])
        let delays = route.bodies.map { ($0["variables"] as? [String: Any])?["input"] as? [String: Any] }.map { $0?["delay"] as? Int }
        XCTAssertEqual(delays, [nil, 60, nil, 60])
    }
}
