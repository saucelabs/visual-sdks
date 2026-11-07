import Foundation
import XCTest
@testable import SauceVisual

/// Each test owns its store and URLProtocol route; no live credentials or network calls.
final class ContributionRecoveryTests: XCTestCase, @unchecked Sendable {
    private let buildID = "0f8fad5b-d9cb-469f-a165-70867728950e"
    private let environment = ["SAUCE_USERNAME": "test-user", "SAUCE_ACCESS_KEY": "not-a-real-key", "SAUCE_REGION": "staging"]

    private func response(mode: String? = nil, status: String = "RUNNING") -> StubURLProtocol.Reply {
        var value: [String: Any] = ["id": buildID, "name": "Build", "status": status]
        if let mode { value["mode"] = mode }
        return .json(["data": ["result": value]])
    }

    private func client(_ route: StubURLProtocol.Route, store: SharedBuildStore,
                        options: VisualBuildOptions = VisualBuildOptions(name: "Build")) throws -> VisualClient {
        try VisualClient(credentials: nil, region: nil, options: options, session: StubURLProtocol.session(route),
                         environment: environment, store: store)
    }

    private func api(_ route: StubURLProtocol.Route) throws -> VisualAPI {
        VisualAPI(region: .staging, credentials: try VisualCredentials(username: "test-user", accessKey: "not-a-real-key"),
                  session: StubURLProtocol.session(route))
    }

    func testNullExecutionErrorsNeverReplayCreation() async throws {
        let errors: [[String: Any]] = [["message": "synthetic-secret", "path": ["result", "id"]]]
        for data: Any in [NSNull(), ["result": NSNull()]] {
            let route = StubURLProtocol.Route([.json(["data": data, "errors": errors]), response()])
            let store = SharedBuildStore()
            let visual = try client(route, store: store)
            for _ in 0..<2 {
                do {
                    _ = try await visual.build()
                    XCTFail("An uncertain mutation must not be repeated")
                } catch {
                    XCTAssertEqual((error as? VisualAPIError)?.code, .apiError)
                    XCTAssertFalse(String(describing: error).contains("synthetic-secret"))
                    XCTAssertFalse((error as NSError).localizedDescription.contains("synthetic-secret"))
                }
            }
            let other = try client(StubURLProtocol.Route([]), store: store, options: VisualBuildOptions(name: "Other"))
            await XCTAssertThrowsErrorAsync(try await other.build()) {
                XCTAssertEqual($0 as? VisualError, .conflictingConfiguration)
            }
            XCTAssertEqual(route.requests.count, 1)
        }
    }

    func testRejectedCallerCannotBindAClosedRunAfterCreationFailure() async throws {
        let store = SharedBuildStore()
        let ownerRoute = StubURLProtocol.Route([.failure(.badURL), response(), response(status: "EQUAL")])
        let owner = try client(ownerRoute, store: store)
        await XCTAssertThrowsErrorAsync(try await owner.finish())

        let otherRoute = StubURLProtocol.Route([])
        let other = try client(otherRoute, store: store, options: VisualBuildOptions(name: "Other"))
        await XCTAssertThrowsErrorAsync(try await other.build()) {
            XCTAssertEqual($0 as? VisualError, .buildAlreadyCompleted)
        }
        let finished = try await owner.finish()
        XCTAssertEqual(finished.status, "EQUAL")
        XCTAssertEqual(ownerRoute.requests.count, 3)
        XCTAssertTrue(otherRoute.requests.isEmpty)
    }

    func testReconciliationRejectsMissingAndUnknownModesWithoutMutation() async throws {
        for mode: String? in [nil, "UNKNOWN_FUTURE_STATE"] {
            let route = StubURLProtocol.Route([response(mode: mode), response(status: "EQUAL")])
            let service = try api(route)
            await XCTAssertThrowsErrorAsync(try await service.reconcileFinish(VisualBuild(id: buildID))) {
                XCTAssertEqual(($0 as? VisualAPIError)?.code, .apiError)
            }
            XCTAssertEqual(route.requests.count, 1)
        }
    }

    func testReconciledRunningBuildRetainsDelay() async throws {
        let route = StubURLProtocol.Route([response(mode: "RUNNING"), response()])
        _ = try await api(route).reconcileFinish(VisualBuild(id: buildID), delay: 120)
        let variables = try XCTUnwrap(route.bodies.last?["variables"] as? [String: Any])
        let input = try XCTUnwrap(variables["input"] as? [String: Any])
        XCTAssertEqual(input["delay"] as? Int, 120)
        XCTAssertEqual(route.requests.count, 2)
    }

    func testReconciledCompletedBuildDoesNotRepeatFinish() async throws {
        let route = StubURLProtocol.Route([response(mode: "COMPLETED", status: "EQUAL")])
        let result = try await api(route).reconcileFinish(VisualBuild(id: buildID), delay: 120)
        XCTAssertEqual(result.status, "EQUAL")
        XCTAssertEqual(route.requests.count, 1)
    }

    func testAdmissionBeforeBuildCreationIsDrainedByCleanup() async throws {
        let route = StubURLProtocol.Route([])
        let store = SharedBuildStore()
        let service = try api(route)
        let configuration = BuildConfiguration(endpoint: service.transport.endpoint, credentials: service.transport.credentials,
                                               options: VisualBuildOptions(name: "Build"))
        let lease = try await store.admit(configuration, api: service)
        let completed = CompletionFlag()
        let cleanup = Task {
            let outcome = await store.finishOwnedBuild()
            await completed.set()
            return outcome
        }
        // isClosed is set before the drain suspends: no timing sleep is needed.
        while !(await store.isClosed) { await Task.yield() }
        let premature = await completed.value
        XCTAssertFalse(premature)
        await store.release(lease)
        guard case .noBuild = await cleanup.value else { return XCTFail("No remote work was started") }
        XCTAssertTrue(route.requests.isEmpty)
    }

    func testManualBorrowedFinishIsReportedByCleanup() async throws {
        let route = StubURLProtocol.Route([response(mode: "RUNNING"), response(status: "EQUAL")])
        let store = SharedBuildStore()
        let visual = try client(route, store: store, options: VisualBuildOptions(buildId: buildID))
        let finished = try await visual.finish()
        guard case .finished(let reported) = await store.finishOwnedBuild() else {
            return XCTFail("Manual completion must not be reported as left open")
        }
        XCTAssertEqual(reported, finished)
        XCTAssertEqual(route.requests.count, 2)
    }

    @MainActor
    func testPublicPreCancelledCheckNeverCapturesOrBinds() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([])
        let visual = try client(route, store: store)
        let task = Task { @MainActor in
            withUnsafeCurrentTask { $0?.cancel() }
            return try await visual.sauceVisualCheck("No capture")
        }
        do {
            _ = try await task.value
            XCTFail("Expected cancellation before capture")
        } catch {
            XCTAssertTrue(error is CancellationError)
        }
        guard case .noBuild = await store.finishOwnedBuild() else { return XCTFail("No owner should be bound") }
        XCTAssertTrue(route.requests.isEmpty)
    }

    @MainActor
    func testPublicClosedCheckFailsBeforeScreenshot() async throws {
        let route = StubURLProtocol.Route([response(), response(status: "EQUAL")])
        let visual = try client(route, store: SharedBuildStore())
        _ = try await visual.finish()
        do {
            _ = try await visual.sauceVisualCheck("No capture")
            XCTFail("Expected the closed run to reject capture")
        } catch {
            XCTAssertEqual(error as? VisualError, .buildAlreadyCompleted)
        }
        XCTAssertEqual(route.requests.count, 2)
    }
}

private actor CompletionFlag {
    private(set) var value = false
    func set() { value = true }
}
