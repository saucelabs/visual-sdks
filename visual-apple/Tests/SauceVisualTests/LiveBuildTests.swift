import Foundation
import XCTest
import SauceVisual

/// Creates and finishes a real build. Needs `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY`, and fails without them:
///
///     SAUCE_REGION=us-west-1 SAUCE_USERNAME=… SAUCE_ACCESS_KEY=… swift test
final class LiveBuildTests: XCTestCase, @unchecked Sendable {
    func testCreateAndFinishBuild() async throws {
        let client = try VisualClient(options: VisualBuildOptions(
            name: "Apple SDK live test", project: "visual-apple", branch: "feat/visual-apple-build-creation", defaultBranch: "main"
        ))

        let build = try await client.build()
        XCTAssertNotNil(UUID(uuidString: build.id))
        XCTAssertEqual(build.name, "Apple SDK live test")
        XCTAssertEqual(build.project, "visual-apple")
        XCTAssertEqual(build.branch, "feat/visual-apple-build-creation")
        XCTAssertEqual(build.defaultBranch, "main")
        print("Sauce Visual build: \(build.url ?? build.id) (\(client.region.name))")

        let again = try await client.build()
        XCTAssertEqual(again.id, build.id)

        let finished = try await client.finish()
        XCTAssertEqual(finished.id, build.id)
        print("Finished with status: \(finished.status ?? "unknown")")
    }
}
