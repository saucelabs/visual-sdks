import Foundation
import XCTest
import SauceVisual

final class ExampleTests: XCTestCase, @unchecked Sendable {
    func testObjectiveCConsumerIsLinked() {
        // A Swift-only fixture must not silently replace the Objective-C consumer.
        XCTAssertNotNil(NSClassFromString("ObjectiveCConsumerTests"))
    }
}

/// Runs the Swift example against a real backend from the simulator or Mac. Needs credentials, and
/// fails without them. `Scripts/test.sh` forwards `SAUCE_*` from your shell or CI:
///
///     SAUCE_REGION=us-west-1 SAUCE_USERNAME=… SAUCE_ACCESS_KEY=… Scripts/test.sh source iphone
final class LiveBuildConsumerTests: XCTestCase, @unchecked Sendable {
    func testSwiftExampleCreatesAndFinishesBuild() async throws {
        let finished = try await runSwiftExample(VisualBuildOptions(
            name: "Apple SDK consumer live test", project: "visual-apple",
            branch: "feat/visual-apple-build-creation", defaultBranch: "main"
        ))
        XCTAssertNotNil(UUID(uuidString: finished.id))
        XCTAssertEqual(finished.name, "Apple SDK consumer live test")
        XCTAssertEqual(finished.project, "visual-apple")
        XCTAssertEqual(finished.branch, "feat/visual-apple-build-creation")
        XCTAssertEqual(finished.defaultBranch, "main")
    }
}
