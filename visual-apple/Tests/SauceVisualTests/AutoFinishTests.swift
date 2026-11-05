import Foundation
import XCTest
// Release runs need `-Xswiftc -enable-testing` for this import.
@testable import SauceVisual

// `@unchecked Sendable` is safe: the tests keep no shared state.
final class AutoFinishTests: XCTestCase, @unchecked Sendable {
    private let buildID = "0f8fad5b-d9cb-469f-a165-70867728950e"
    private let environment = ["SAUCE_USERNAME": "user", "SAUCE_ACCESS_KEY": "key"]

    private func reply(status: String, mode: String = "RUNNING") -> StubURLProtocol.Reply {
        .json(["data": ["result": [
            "id": buildID, "name": "Build", "status": status, "url": "https://visual.test/builds/\(buildID)", "mode": mode
        ]]])
    }

    private func client(_ route: StubURLProtocol.Route, _ store: SharedBuildStore, _ options: VisualBuildOptions) throws -> VisualClient {
        try VisualClient(
            credentials: nil, region: .staging, options: options, session: StubURLProtocol.session(route),
            environment: environment, store: store
        )
    }

    /// The input of the last request, which finishes the build.
    private func finishInput(_ route: StubURLProtocol.Route) -> [String: Any]? {
        (route.bodies.last?["variables"] as? [String: Any])?["input"] as? [String: Any]
    }

    func testFinishesBuildThisRunCreated() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([reply(status: "RUNNING"), reply(status: "EQUAL")])
        _ = try await client(route, store, VisualBuildOptions(name: "Build")).build()

        guard case .finished(let build) = await store.finishOwnedBuild() else { return XCTFail("Not finished") }
        XCTAssertEqual(build.status, "EQUAL")
        XCTAssertTrue((route.bodies.last?["query"] as? String)?.contains("finishBuild") == true)
        XCTAssertEqual(finishInput(route) as? [String: String], ["uuid": buildID], "No delay sent")
    }

    func testEveryWorkerFinishesACustomIdBuildWithADelay() async throws {
        let created = [StubURLProtocol.Reply.json(["data": ["result": NSNull()]]), reply(status: "RUNNING")]
        for (label, replies) in [("reused", [reply(status: "RUNNING")]), ("created", created)] {
            let store = SharedBuildStore()
            let route = StubURLProtocol.Route(replies + [reply(status: "RUNNING")])
            _ = try await client(route, store, VisualBuildOptions(customId: "ci-42", finishDelay: 30.2)).build()

            guard case .finishDelayed(let build, let seconds) = await store.finishOwnedBuild() else {
                return XCTFail("Not finished: \(label)")
            }
            XCTAssertEqual(build.id, buildID, label)
            XCTAssertEqual(seconds, 31, "Rounded up: \(label)")
            XCTAssertEqual(finishInput(route)?["delay"] as? Int, 31, label)
        }
    }

    func testManualFinishSendsTheDelay() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([reply(status: "RUNNING"), reply(status: "RUNNING")])
        let visual = try client(route, store, VisualBuildOptions(customId: "ci-42", finishDelay: 0))
        _ = try await visual.finish()

        XCTAssertEqual(finishInput(route)?["delay"] as? Int, 0)
        guard case .finishDelayed = await store.finishOwnedBuild() else { return XCTFail("Not finished") }
        XCTAssertEqual(route.requests.count, 2, "Lookup and one finishBuild")
    }

    func testLeavesReusedBuildOpen() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([reply(status: "RUNNING")])
        _ = try await client(route, store, VisualBuildOptions(customId: "ci-42")).build()

        guard case .leftOpen = await store.finishOwnedBuild() else { return XCTFail("Should stay open") }
        XCTAssertEqual(route.requests.count, 1, "No finishBuild request")
    }

    func testLeavesNewCustomIdBuildOpen() async throws {
        let store = SharedBuildStore()
        // No build has this custom ID yet, so this worker creates it. Others may still join it.
        let route = StubURLProtocol.Route([.json(["data": ["result": NSNull()]]), reply(status: "RUNNING")])
        _ = try await client(route, store, VisualBuildOptions(customId: "ci-42")).build()

        guard case .leftOpen = await store.finishOwnedBuild() else { return XCTFail("Should stay open") }
        XCTAssertTrue((route.bodies.last?["query"] as? String)?.contains("createBuild") == true, "This worker created it")
        XCTAssertEqual(route.requests.count, 2, "No finishBuild request")
    }

    func testNothingToFinishWithoutBuild() async {
        guard case .noBuild = await SharedBuildStore().finishOwnedBuild() else { return XCTFail("Expected no build") }
    }

    func testFailedCreationIsNotFinished() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([.failure(.cannotConnectToHost)])
        _ = try? await client(route, store, VisualBuildOptions()).build()

        guard case .noBuild = await store.finishOwnedBuild() else { return XCTFail("Expected no build") }
    }

    func testManualFinishIsNotRepeated() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([reply(status: "RUNNING"), reply(status: "EQUAL")])
        let visual = try client(route, store, VisualBuildOptions())
        _ = try await visual.finish()

        guard case .finished = await store.finishOwnedBuild() else { return XCTFail("Not finished") }
        XCTAssertEqual(route.requests.count, 2, "createBuild and one finishBuild")
    }

    func testObserverWaitsForFinish() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([reply(status: "RUNNING"), reply(status: "EQUAL")])
        _ = try await client(route, store, VisualBuildOptions()).build()

        let observer = AutoFinish.Observer(store: store, timeout: 10)
        await MainActor.run { observer.testBundleDidFinish(Bundle.main) }
        XCTAssertEqual(route.requests.count, 2, "finishBuild completed before the observer returned")
    }

    func testMessages() throws {
        let build = VisualBuild(id: buildID, status: "UNAPPROVED", url: "https://app.saucelabs.com/visual/builds/\(buildID)")
        XCTAssertNil(AutoFinish.message(for: .noBuild))
        XCTAssertEqual(AutoFinish.message(for: .leftOpen(build)),
                       "Sauce Visual: left build https://app.saucelabs.com/visual/builds/\(buildID) open, because it is named by a build ID or custom ID. Finish it once every worker is done.")
        XCTAssertEqual(AutoFinish.message(for: .finished(build)),
                       "Sauce Visual: finished build https://app.saucelabs.com/visual/builds/\(buildID) (UNAPPROVED).")
        XCTAssertEqual(AutoFinish.message(for: .finishDelayed(build, seconds: 60)),
                       "Sauce Visual: build https://app.saucelabs.com/visual/builds/\(buildID) finishes 60 s after the last worker finishes it.")
        XCTAssertEqual(AutoFinish.message(for: .failed(VisualError.networkFailure)),
                       "Sauce Visual: could not finish the build. Could not reach the Sauce Visual API.")
    }
}
