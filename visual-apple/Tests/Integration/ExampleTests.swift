import Foundation
import XCTest
import SauceVisual

final class ExampleTests: XCTestCase, @unchecked Sendable {
    func testSwiftExample() async throws {
        // A Swift-only fixture must not silently replace the Objective-C consumer.
        XCTAssertNotNil(NSClassFromString("ObjectiveCConsumerTests"))
        let summary = try await runSwiftExample()
        XCTAssertEqual(summary.checkpointCount, 2)
        XCTAssertTrue(summary.isMock)
    }
}
