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

#if !os(tvOS)
/// Full-page edge cases. Check the uploaded images in the dashboard.
final class FullPageEdgeCaseTests: XCTestCase, @unchecked Sendable {
    /// Nothing to scroll, so the image is just the list.
    @MainActor
    func testShortContentNeedsNoScrolling() async throws {
        try await check("Full page short list", screen: "-fullPageShortList")
    }

    /// Stops after two screenshots, although there is more to scroll.
    @MainActor
    func testScrollLimitStopsEarly() async throws {
        try await check("Full page limit 2", screen: "-fullPageList") { _, list in
            VisualCheckOptions(fullPage: FullPageScreenshot(scrollElement: list, scrollLimit: 2))
        }
    }

    /// Starts from where the test left the list, not from the top.
    @MainActor
    func testStartsFromTheCurrentPosition() async throws {
        try await check("Full page from the middle", screen: "-fullPageList") { _, list in
            list.swipeUp()
            return VisualCheckOptions(fullPage: FullPageScreenshot(scrollElement: list))
        }
    }

    /// Only the short list between a header and a footer is captured.
    @MainActor
    func testListBetweenHeaderAndFooter() async throws {
        try await check("Full page inset list", screen: "-fullPageInset")
    }

    /// Rows of different heights and colours, in a plain scroll view.
    @MainActor
    func testScrollViewWithMixedRows() async throws {
        try await check("Full page scroll view", screen: "-fullPageScrollView")
    }

    /// A different clip element wins, so only that element is captured.
    @MainActor
    func testDifferentClipElementSkipsTheFullPage() async throws {
        try await check("Full page skipped for clip", screen: "-fullPageList") { app, list in
            VisualCheckOptions(clipElement: app.staticTexts["Row 1"], fullPage: FullPageScreenshot(scrollElement: list))
        }
    }

    /// Ignore regions and the element tree work together with the full page.
    @MainActor
    func testIgnoredElementAndDom() async throws {
        try await check("Full page with ignore and DOM", screen: "-fullPageList") { app, list in
            VisualCheckOptions(
                ignoreElements: [app.staticTexts["Row 2"]], captureDom: true, fullPage: FullPageScreenshot(scrollElement: list)
            )
        }
    }

    /// A scroll element that doesn't exist fails the check before anything is uploaded.
    @MainActor
    func testMissingScrollElementIsReported() async throws {
        do {
            try await check("Full page missing", screen: "-fullPageList") { app, _ in
                VisualCheckOptions(fullPage: FullPageScreenshot(scrollElement: app.tables["does-not-exist"]))
            }
            XCTFail("Expected elementNotFound")
        } catch {
            XCTAssertEqual(error as? VisualError, .elementNotFound)
        }
    }

    /// Launches the host on `screen` and checks it. Without `options`, the whole list is captured.
    @MainActor
    private func check(
        _ name: String, screen: String, options: ((XCUIApplication, XCUIElement) -> VisualCheckOptions)? = nil
    ) async throws {
        let app = XCUIApplication()
        app.launchArguments = [screen]
        app.launch()
        defer { app.terminate() }
        let list = app.descendants(matching: .any).matching(identifier: "fullPageList").firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 10), "List did not appear")
        let visual = try VisualClient(options: liveBuildOptions)
        let checkOptions = options?(app, list) ?? VisualCheckOptions(fullPage: FullPageScreenshot(scrollElement: list))
        try await visual.sauceVisualCheck(name, options: checkOptions)
    }
}
#endif
