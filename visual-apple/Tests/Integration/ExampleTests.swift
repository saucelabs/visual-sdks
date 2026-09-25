import Foundation
import XCTest
import SauceVisual

final class ExampleTests: XCTestCase, @unchecked Sendable {
    /// The app under test does not link the SDK, so it must launch on its own.
    @MainActor
    func testAppUnderTestLaunches() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["SauceVisual SDK integration host"].waitForExistence(timeout: 30))
        app.terminate()
    }
}

/// Creates a real build while driving the app under test. Needs credentials, and fails without them.
/// `Scripts/test.sh` forwards `SAUCE_*` from your shell or CI, and checks the build was finished
/// automatically after the last test:
///
///     SAUCE_REGION=us-west-1 SAUCE_USERNAME=… SAUCE_ACCESS_KEY=… Scripts/test.sh source iphone
final class LiveBuildConsumerTests: XCTestCase, @unchecked Sendable {
    @MainActor
    func testSwiftExampleCreatesBuild() async throws {
        let app = XCUIApplication()
        app.launch()
        let build = try await runSwiftExample(VisualBuildOptions(
            name: "Apple SDK consumer live test", project: "visual-apple",
            branch: "feat/visual-apple-build-creation", defaultBranch: "main"
        ))
        XCTAssertNotNil(UUID(uuidString: build.id))
        XCTAssertEqual(build.name, "Apple SDK consumer live test")
        XCTAssertEqual(build.project, "visual-apple")
        XCTAssertEqual(build.branch, "feat/visual-apple-build-creation")
        XCTAssertEqual(build.defaultBranch, "main")
        XCTAssertEqual(build.status, "RUNNING", "Open until the test run ends")
        app.terminate()
    }
}
