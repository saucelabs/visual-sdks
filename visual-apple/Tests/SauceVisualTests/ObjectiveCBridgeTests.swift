#if canImport(ObjectiveC)
import Foundation
import XCTest
import SauceVisual

// Test-only: no mutable instance state, XCTest owns its synchronization.
final class ObjectiveCBridgeTests: XCTestCase, @unchecked Sendable {
    func testObjectiveCErrorCodesMatchSwiftErrors() {
        let codes: [VisualErrorCode] = [
            .cancelled, .invalidCredentials, .unknownRegion, .invalidBuildId,
            .buildAlreadyCompleted, .networkFailure, .apiError
        ]
        for code in codes {
            let error = VisualError(rawValue: code.rawValue)! as NSError
            XCTAssertEqual(error.domain, VisualObjCClient.errorDomain)
            XCTAssertEqual(error.code, code.rawValue)
            XCTAssertEqual(error.userInfo.count, 1)
        }
    }

    func testRegionBridge() throws {
        XCTAssertEqual(VisualRegion.defaultRegion.name, "us-west-1")
        XCTAssertEqual(try VisualRegion.named("us-west-4-i3er"), VisualRegion.usWest1)
        XCTAssertEqual(VisualRegion.staging.graphqlEndpoint.absoluteString, "https://api.staging.saucelabs.net/v1/visual/graphql")
        XCTAssertThrowsError(try VisualRegion.named("mars")) {
            XCTAssertEqual(($0 as NSError).code, VisualErrorCode.unknownRegion.rawValue)
        }
    }

    func testClientBridgeValidatesCredentials() throws {
        XCTAssertThrowsError(try VisualObjCClient(username: "user", accessKey: " ", region: nil, options: nil)) {
            XCTAssertEqual(($0 as NSError).domain, VisualObjCClient.errorDomain)
            XCTAssertEqual(($0 as NSError).code, VisualErrorCode.invalidCredentials.rawValue)
        }
        let options = VisualBuildConfiguration(
            name: "Build", project: nil, branch: nil, defaultBranch: nil, customId: nil, buildId: nil
        )
        let client = try VisualObjCClient(username: "user", accessKey: "key", region: .staging, options: options)
        XCTAssertEqual(client.region, VisualRegion.staging)
        XCTAssertEqual(client.options.name, "Build")
    }

    func testClientBridgeRejectsInvalidBuildId() {
        let options = VisualBuildConfiguration(
            name: nil, project: nil, branch: nil, defaultBranch: nil, customId: nil, buildId: "not-a-uuid"
        )
        XCTAssertThrowsError(try VisualObjCClient(username: "user", accessKey: "key", region: .staging, options: options)) {
            XCTAssertEqual(($0 as NSError).code, VisualErrorCode.invalidBuildId.rawValue)
        }
    }
}
#endif
