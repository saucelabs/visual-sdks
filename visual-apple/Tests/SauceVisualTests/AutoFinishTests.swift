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

    func testFinishesBuildThisRunCreated() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([reply(status: "RUNNING"), reply(status: "EQUAL")])
        _ = try await client(route, store, VisualBuildOptions(name: "Build")).build()

        guard case .finished(let build) = await store.finishCreatedBuild() else { return XCTFail("Not finished") }
        XCTAssertEqual(build.status, "EQUAL")
        XCTAssertTrue((route.bodies.last?["query"] as? String)?.contains("finishBuild") == true)
    }

    func testLeavesReusedBuildOpen() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([reply(status: "RUNNING")])
        _ = try await client(route, store, VisualBuildOptions(customId: "ci-42")).build()

        guard case .leftOpen = await store.finishCreatedBuild() else { return XCTFail("Should stay open") }
        XCTAssertEqual(route.requests.count, 1, "No finishBuild request")
    }

    func testNothingToFinishWithoutBuild() async {
        guard case .noBuild = await SharedBuildStore().finishCreatedBuild() else { return XCTFail("Expected no build") }
    }

    func testFailedCreationIsNotFinished() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([.failure(.cannotConnectToHost)])
        _ = try? await client(route, store, VisualBuildOptions()).build()

        guard case .noBuild = await store.finishCreatedBuild() else { return XCTFail("Expected no build") }
    }

    func testManualFinishIsNotRepeated() async throws {
        let store = SharedBuildStore()
        let route = StubURLProtocol.Route([reply(status: "RUNNING"), reply(status: "EQUAL")])
        let visual = try client(route, store, VisualBuildOptions())
        _ = try await visual.finish()

        guard case .finished = await store.finishCreatedBuild() else { return XCTFail("Not finished") }
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
        XCTAssertEqual(AutoFinish.message(for: .finished(build)),
                       "Sauce Visual: finished build https://app.saucelabs.com/visual/builds/\(buildID) (UNAPPROVED).")
        XCTAssertEqual(AutoFinish.message(for: .failed(VisualError.networkFailure)),
                       "Sauce Visual: could not finish the build. Could not reach the Sauce Visual API.")
    }
}
