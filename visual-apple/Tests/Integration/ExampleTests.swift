import Foundation
import XCTest
import SauceVisual

final class ExampleTests: XCTestCase, @unchecked Sendable {
    /// The app under test doesn't include the SDK, so check it launches on its own.
    @MainActor
    func testAppUnderTestLaunches() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["SauceVisual SDK integration host"].waitForExistence(timeout: 30))
        app.terminate()
    }
}

/// The build every live test adds to. The timestamp is fixed for the run, so each run gets its own name.
/// Every client in a test process must use the same options, or the SDK throws `conflictingConfiguration`.
let liveBuildOptions = VisualBuildOptions(
    name: "Apple SDK consumer live test - \(Int(Date().timeIntervalSince1970))", project: "visual-apple",
    branch: "feat/visual-apple-snapshot", defaultBranch: "main"
)

/// Takes a real snapshot, so it needs credentials:
/// `SAUCE_USERNAME=… SAUCE_ACCESS_KEY=… Scripts/test.sh source iphone`
final class LiveBuildConsumerTests: XCTestCase, @unchecked Sendable {
    @MainActor
    func testSwiftExampleChecksScreen() async throws {
        let app = XCUIApplication()
        app.launch()
        let snapshot = try await runSwiftExample(liveBuildOptions)
        XCTAssertNotNil(UUID(uuidString: snapshot.id))
        XCTAssertNotNil(UUID(uuidString: snapshot.buildId))
        XCTAssertEqual(snapshot.name, "Home screen")
        XCTAssertEqual(snapshot.suiteName, "LiveBuildConsumerTests")
        XCTAssertEqual(snapshot.testName, "testSwiftExampleChecksScreen")
        app.terminate()
    }

    /// Scrolls the host's list and uploads one stitched image. Check it in the dashboard.
    @MainActor
    func testFullPageList() async throws {
        let app = XCUIApplication()
        app.launchArguments = ["-fullPageList"]
        app.launch()
        let list = app.descendants(matching: .any).matching(identifier: "fullPageList").firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 10), "List did not appear")
        let visual = try VisualClient(options: liveBuildOptions)
        let options = VisualCheckOptions(fullPage: FullPageScreenshot(scrollElement: list, scrollLimit: 5))
        #if os(tvOS)
        do {
            try await visual.sauceVisualCheck("Full page list", options: options)
            XCTFail("Full page should not be available on tvOS")
        } catch {
            XCTAssertEqual(error as? VisualError, .fullPageNotSupported)
        }
        #else
        let snapshot = try await visual.sauceVisualCheck("Full page list", options: options)
        XCTAssertNotNil(UUID(uuidString: snapshot.id))
        #endif
        app.terminate()
    }

    /// Uploads the app's element tree too. Check the snapshot's DOM in the dashboard.
    @MainActor
    func testHomeScreenWithDom() async throws {
        let app = XCUIApplication()
        app.launch()
        let visual = try VisualClient(options: liveBuildOptions)
        let snapshot = try await visual.sauceVisualCheck("Home screen (DOM)", options: VisualCheckOptions(captureDom: true))
        XCTAssertNotNil(UUID(uuidString: snapshot.id))
        app.terminate()
    }
}
