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

/// Takes a real snapshot, so it needs credentials:
/// `SAUCE_USERNAME=… SAUCE_ACCESS_KEY=… Scripts/test.sh source iphone`
final class LiveBuildConsumerTests: XCTestCase, @unchecked Sendable {
    @MainActor
    func testSwiftExampleChecksScreen() async throws {
        let app = XCUIApplication()
        app.launch()
        let snapshot = try await runSwiftExample(VisualBuildOptions(
            name: "Apple SDK consumer live test", project: "visual-apple",
            branch: "feat/visual-apple-snapshot", defaultBranch: "main"
        ))
        XCTAssertNotNil(UUID(uuidString: snapshot.id))
        XCTAssertNotNil(UUID(uuidString: snapshot.buildId))
        XCTAssertEqual(snapshot.name, "Home screen")
        XCTAssertEqual(snapshot.suiteName, "LiveBuildConsumerTests")
        XCTAssertEqual(snapshot.testName, "testSwiftExampleChecksScreen")
        app.terminate()
    }
}
