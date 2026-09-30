import Foundation
import XCTest
import SauceVisual

// `@unchecked Sendable` is safe: the tests keep no shared state.
final class ConfigurationTests: XCTestCase, @unchecked Sendable {
    func testDefaultRegionIsUSWest1() throws {
        XCTAssertEqual(SauceRegion.default, .usWest1)
        XCTAssertEqual(try SauceRegion.fromEnvironment([:]), .usWest1)
        XCTAssertEqual(try SauceRegion.fromEnvironment(["SAUCE_REGION": "  "]), .usWest1)
    }

    func testRegionNamesAndAliases() throws {
        let expected: [String: SauceRegion] = [
            "us-west-1": .usWest1, "us": .usWest1, "us-west-4-i3er": .usWest1, "US-WEST-1": .usWest1,
            "us-east-4": .usEast4, "us-east-4-cm5i": .usEast4,
            "eu-central-1": .euCentral1, "eu": .euCentral1, "eu-west-3-lnbf": .euCentral1,
            "staging": .staging, "us-west-4-jeh6": .staging
        ]
        for (name, region) in expected {
            XCTAssertEqual(try SauceRegion.named(name), region, name)
        }
    }

    func testUnknownRegionThrows() {
        for name in ["us-west-4", "apac", "local", "nowhere"] {
            XCTAssertThrowsError(try SauceRegion.named(name)) {
                XCTAssertEqual($0 as? VisualError, .unknownRegion)
            }
        }
    }

    func testCredentialsFromEnvironment() throws {
        let credentials = try VisualCredentials.fromEnvironment([
            "SAUCE_USERNAME": " user ", "SAUCE_ACCESS_KEY": "key\n"
        ])
        XCTAssertEqual(credentials.username, "user")
        XCTAssertEqual(credentials.accessKey, "key")
    }

    func testMissingCredentialsThrow() {
        let environments: [[String: String]] = [
            [:],
            ["SAUCE_USERNAME": "user"],
            ["SAUCE_ACCESS_KEY": "key"],
            ["SAUCE_USERNAME": " ", "SAUCE_ACCESS_KEY": "key"]
        ]
        for environment in environments {
            XCTAssertThrowsError(try VisualCredentials.fromEnvironment(environment)) {
                XCTAssertEqual($0 as? VisualError, .invalidCredentials)
            }
        }
    }

    func testCredentialsNeverPrintAccessKey() throws {
        let credentials = try VisualCredentials(username: "user", accessKey: "super-secret")
        for text in [
            String(describing: credentials), String(reflecting: credentials), "\(credentials)",
            String(describing: Mirror(reflecting: credentials).children.map(\.value))
        ] {
            XCTAssertFalse(text.contains("super-secret"), text)
        }
    }

    func testBuildOptionsExplicitValuesWinOverEnvironment() {
        let environment = [
            "SAUCE_VISUAL_BUILD_NAME": "Env build", "SAUCE_VISUAL_PROJECT": "Env project",
            "SAUCE_VISUAL_BRANCH": "env-branch", "SAUCE_VISUAL_DEFAULT_BRANCH": "env-main",
            "SAUCE_VISUAL_CUSTOM_ID": "env-custom", "SAUCE_VISUAL_BUILD_ID": "env-id"
        ]
        let explicit = VisualBuildOptions(name: " Build ", project: "Project", branch: "", customId: "custom")
            .resolved(with: environment)
        XCTAssertEqual(explicit, VisualBuildOptions(
            name: "Build", project: "Project", branch: "env-branch", defaultBranch: "env-main",
            customId: "custom", buildId: "env-id"
        ))
        XCTAssertEqual(VisualBuildOptions().resolved(with: [:]), VisualBuildOptions())
    }

    func testErrorCodesAreStable() {
        let codes: [(VisualError, Int)] = [
            (.cancelled, 1), (.invalidCredentials, 2), (.unknownRegion, 3), (.invalidBuildId, 4),
            (.buildAlreadyCompleted, 5), (.networkFailure, 6), (.apiError, 7),
            (.invalidSnapshotName, 8), (.elementNotFound, 9),
            (.clipElementOffScreen, 10), (.screenshotFailed, 11)
        ]
        for (error, code) in codes {
            XCTAssertEqual((error as NSError).code, code)
            XCTAssertEqual(VisualErrorCode(rawValue: code)?.rawValue, code, "Objective-C code \(code) matches Swift")
            XCTAssertEqual((error as NSError).domain, "com.saucelabs.visual.apple")
        }
        let apiError = VisualAPIError(code: .apiError, detail: "Project not found") as NSError
        XCTAssertEqual(apiError.domain, "com.saucelabs.visual.apple")
        XCTAssertEqual(apiError.code, 7)
        XCTAssertTrue(apiError.localizedDescription.hasSuffix("Project not found."))
    }

    func testErrorsPrintReadableMessages() {
        let expected: [(Error, String)] = [
            (VisualError.cancelled, "The operation was cancelled."),
            (VisualError.invalidCredentials, "Invalid Sauce Labs credentials. Check your username and access key."),
            (VisualError.unknownRegion, "Unknown Sauce Labs region. Check the region name or SAUCE_REGION."),
            (VisualError.invalidBuildId, "Invalid Sauce Visual build ID. Check that it is a UUID."),
            (VisualError.buildAlreadyCompleted, "The Sauce Visual build is already finished. Start a new build to add snapshots."),
            (VisualError.networkFailure, "Could not reach the Sauce Visual API."),
            (VisualError.apiError, "The Sauce Visual API returned an error."),
            (VisualError.invalidSnapshotName, "Invalid snapshot name. Give the snapshot a name that is not empty."),
            (VisualError.elementNotFound,
             "An element in the check options doesn't exist. Wait for it before the check, or remove it."),
            (VisualError.clipElementOffScreen, "The clip element is off screen. Scroll it into view before the check."),
            (VisualError.screenshotFailed, "Could not process the screenshot."),
            (VisualAPIError(code: .invalidCredentials, statusCode: 401),
             "Invalid Sauce Labs credentials. Check your username and access key."),
            (VisualAPIError(code: .apiError, detail: "Project not found"),
             "The Sauce Visual API returned an error. Project not found."),
            (VisualAPIError(code: .apiError, detail: "HTTP 500.", statusCode: 500),
             "The Sauce Visual API returned an error. HTTP 500.")
        ]
        for (error, message) in expected {
            XCTAssertEqual("\(error)", message)
            XCTAssertEqual((error as NSError).localizedDescription, message)
        }
    }
}
