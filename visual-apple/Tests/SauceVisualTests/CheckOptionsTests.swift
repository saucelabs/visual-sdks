import CoreGraphics
import Foundation
import XCTest
// Release runs need `-Xswiftc -enable-testing` for this import.
@testable import SauceVisual

// `@unchecked Sendable` is safe: the tests keep no shared state.
final class CheckOptionsTests: XCTestCase, @unchecked Sendable {
    private let buildID = "0f8fad5b-d9cb-469f-a165-70867728950e"
    private let uploadID = "7c9e6679-7425-40de-944b-e07fc1f90ae7"
    private let environment = ["SAUCE_USERNAME": "user", "SAUCE_ACCESS_KEY": "super-secret", "SAUCE_REGION": "staging"]
    /// 1206×2622 pixels at 3 pixels per point, like an iPhone 17.
    private let screenshot = Screenshot.Capture(png: Data("png".utf8), scale: 3, pixelSize: CGSize(width: 1206, height: 2622))

    func testRegionsAreScaledToPixelsAndClippedToTheImage() {
        let size = CGSize(width: 300, height: 300)
        XCTAssertEqual(PixelRegion(CGRect(x: 10, y: 20, width: 30, height: 40), scale: 3, imageSize: size, name: "a", diffingOptions: nil),
                       region(30, 60, 90, 120, name: "a"))
        XCTAssertEqual(PixelRegion(CGRect(x: 0.4, y: 0.4, width: 1.3, height: 1.3), scale: 1, imageSize: size, name: nil, diffingOptions: nil),
                       region(0, 0, 2, 2), "Fractional points cover every touched pixel")
        XCTAssertEqual(PixelRegion(CGRect(x: -10, y: 90, width: 30, height: 30), scale: 3, imageSize: size, name: nil, diffingOptions: nil),
                       region(0, 270, 60, 30), "Clipped to the image")
        XCTAssertNil(PixelRegion(CGRect(x: 200, y: 0, width: 10, height: 10), scale: 3, imageSize: size, name: nil, diffingOptions: nil),
                     "Entirely off screen")
        XCTAssertNil(PixelRegion(CGRect(x: 0, y: 0, width: 0, height: 10), scale: 3, imageSize: size, name: nil, diffingOptions: nil))
        XCTAssertNil(PixelRegion(.null, scale: 3, imageSize: size, name: nil, diffingOptions: nil))
    }

    func testScaleComesFromThePNGHeader() {
        var png = Data([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13]) + Data("IHDR".utf8)
        png += Data([0, 0, 0x04, 0xB6, 0, 0, 0x0A, 0x3E])  // 1206 × 2622
        let capture = Screenshot.capture(png: png, pointWidth: 402)
        XCTAssertEqual(capture.pixelSize, CGSize(width: 1206, height: 2622))
        XCTAssertEqual(capture.scale, 3)
        XCTAssertEqual(Screenshot.capture(png: Data(), pointWidth: 402).scale, 1, "Unreadable images are not scaled")
    }

    @MainActor
    func testOptionsResolveToARequest() throws {
        let options = VisualCheckOptions(
            testName: "custom test",
            ignoreRegions: [CGRect(x: 0, y: 0, width: 402, height: 20)],
            regions: [
                .detectChanges(in: CGRect(x: 10, y: 100, width: 50, height: 50), [.visual], name: "logo"),
                .ignoreChanges(in: CGRect(x: 0, y: 900, width: 10, height: 10), name: "off screen")
            ],
            diffingMethod: .experimental,
            diffingOptions: .all.subtracting(.style),
            diffingMethodSensitivity: .high,
            diffingMethodTolerance: DiffingMethodTolerance(color: 0.1, minChangeSize: 3)
        )
        let running = TestIdentity(testName: "testSomething", suiteName: "Suite")
        let request = try options.resolve(running: running, screenshot: screenshot)

        XCTAssertEqual(request.test, TestIdentity(testName: "custom test", suiteName: "Suite"))
        XCTAssertEqual(request.regions, [
            region(0, 0, 1206, 60),
            region(30, 300, 150, 150, name: "logo", diffingOptions: [.visual])
        ], "The off-screen region is dropped")
        XCTAssertEqual(request.diffingMethod, .experimental)
        XCTAssertEqual(request.diffingOptions, [.content, .dimensions, .position, .structure, .visual])
        XCTAssertEqual(request.diffingMethodSensitivity, .high)
        XCTAssertEqual(request.diffingMethodTolerance, DiffingMethodTolerance(color: 0.1, minChangeSize: 3))
    }

    @MainActor
    func testDefaultOptionsUseTheRunningTestAndBalanced() throws {
        let running = TestIdentity(testName: "testSomething", suiteName: "Suite")
        let request = try VisualCheckOptions().resolve(running: running, screenshot: screenshot)
        XCTAssertEqual(request, SnapshotRequest(test: running))
        XCTAssertEqual(request.diffingMethod, .balanced)
    }

    func testRequestIsSentAsSnapshotInput() async throws {
        let request = SnapshotRequest(
            regions: [region(0, 0, 1206, 60), region(30, 300, 150, 150, name: "logo", diffingOptions: [.visual, .position])],
            diffingMethod: .experimental,
            diffingOptions: [.visual],
            diffingMethodSensitivity: .low,
            diffingMethodTolerance: DiffingMethodTolerance(brightness: 0.2, antiAliasing: 0.5)
        )
        let input = try await snapshotInput(for: request)

        XCTAssertEqual(input["diffingMethod"] as? String, "EXPERIMENTAL")
        XCTAssertEqual(input["diffingMethodSensitivity"] as? String, "LOW")
        XCTAssertEqual(input["diffingMethodTolerance"] as? [String: Double], ["brightness": 0.2, "antiAliasing": 0.5])
        XCTAssertEqual(input["diffingOptions"] as? [String: Bool], flags(visual: true))
        let regions = try XCTUnwrap(input["ignoreRegions"] as? [[String: Any]])
        XCTAssertEqual(regions.count, 2)
        XCTAssertEqual(regions[0] as? [String: Int], ["x": 0, "y": 0, "width": 1206, "height": 60],
                       "A plain ignore region sends no name or diffing options")
        XCTAssertEqual(regions[1]["name"] as? String, "logo")
        XCTAssertEqual(regions[1]["diffingOptions"] as? [String: Bool], flags(visual: true, position: true))
    }

    func testDefaultRequestSendsNoOptionalFields() async throws {
        let input = try await snapshotInput(for: SnapshotRequest())
        XCTAssertEqual(input["diffingMethod"] as? String, "BALANCED")
        for key in ["ignoreRegions", "diffingOptions", "diffingMethodSensitivity", "diffingMethodTolerance"] {
            XCTAssertNil(input[key], "\(key) is left to the server")
        }
    }

    // MARK: - Helpers

    private func region(
        _ x: Int, _ y: Int, _ width: Int, _ height: Int, name: String? = nil, diffingOptions: DiffingOptions? = nil
    ) -> PixelRegion {
        let rect = CGRect(x: x, y: y, width: width, height: height)
        // A positive rectangle inside a large image always resolves.
        return PixelRegion(rect, scale: 1, imageSize: CGSize(width: 10_000, height: 10_000), name: name, diffingOptions: diffingOptions)!
    }

    private func flags(visual: Bool = false, position: Bool = false) -> [String: Bool] {
        ["content": false, "dimensions": false, "position": position, "structure": false, "style": false, "visual": visual]
    }

    /// Runs a check against stubbed responses and returns the `createSnapshot` input.
    private func snapshotInput(for request: SnapshotRequest) async throws -> [String: Any] {
        let route = StubURLProtocol.Route([
            .json(["data": ["result": ["id": buildID, "name": "Build", "status": "RUNNING"]]]),
            .json(["data": ["result": ["id": uploadID, "imageUploadUrl": "https://storage.test/upload"]]]),
            StubURLProtocol.Reply(body: Data()),
            .json(["data": ["result": ["id": "16fd2706-8baf-433b-82eb-8c7fada847da", "name": "Login"]]])
        ])
        let client = try VisualClient(
            credentials: nil, region: nil, options: VisualBuildOptions(name: "Build"),
            session: StubURLProtocol.session(route), environment: environment, store: SharedBuildStore()
        )
        _ = try await client.check(name: "Login", png: Data("png".utf8), request: request)
        let body = route.bodies[3]
        return try XCTUnwrap((body["variables"] as? [String: Any])?["input"] as? [String: Any])
    }
}
