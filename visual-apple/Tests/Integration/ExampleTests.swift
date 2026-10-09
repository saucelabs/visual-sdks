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
}
