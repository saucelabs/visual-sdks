import CoreGraphics
import Foundation
import ImageIO
import XCTest
// Release runs need `-Xswiftc -enable-testing` for this import.
@testable import SauceVisual

// `@unchecked Sendable` is safe: the tests keep no shared state.
final class FullPageTests: XCTestCase, @unchecked Sendable {
    private let width = 40
    private let contentHeight = 600
    /// The scrollable area sits between a 100-row header and a 50-row footer.
    private let clip = CGRect(x: 0, y: 100, width: 40, height: 200)

    func testScreenshotsAreStitchedIntoTheWholeContent() throws {
        // The last scroll only moves 40 rows, and the one after doesn't move at all.
        let positions = [0, 120, 240, 360, 400, 400]
        let screens = try positions.enumerated().map { try screen(scrolledTo: $1, indicator: $0) }
        let rows = try screens.map { try FullPageCapture.rows(of: $0, in: clip, ignoringRight: 2) }

        var frames = FullPageCapture.Frames()
        for index in 1..<rows.count {
            let moved = FullPageCapture.offset(from: rows[index - 1], to: rows[index], expected: 120)
            guard moved != 0 else { break }
            frames.pngs.append(screens[index])
            frames.newRows.append(try XCTUnwrap(moved))
        }

        XCTAssertEqual(frames.newRows, [120, 120, 120, 40])
        let stitched = try FullPageCapture.stitch(first: screens[0], frames: frames, clip: clip)
        XCTAssertEqual(try contentRows(of: stitched), Array(0..<contentHeight))
    }

    func testBlankRowsMatchAnywhereSoTheExpectedShiftWins() {
        let blank = [UInt64](repeating: 7, count: 100)
        XCTAssertEqual(FullPageCapture.offset(from: blank, to: blank, expected: 37), 0, "Nothing moved")
        var page = blank
        page[0] = 1
        XCTAssertEqual(FullPageCapture.offset(from: page, to: blank, expected: 37), 37)
    }

    func testScreenshotsThatDontLineUpStopTheCapture() {
        let previous = (0..<100).map { UInt64($0) }
        let unrelated = (1_000..<1_100).map { UInt64($0) }
        XCTAssertNil(FullPageCapture.offset(from: previous, to: unrelated, expected: 50))
        XCTAssertNil(FullPageCapture.offset(from: [], to: [], expected: 50))
    }

    func testRegionsAreCutAtTheStitchedHeight() throws {
        let rect = CGRect(x: 0, y: 90, width: 10, height: 30)
        let region = try XCTUnwrap(PixelRegion(rect, scale: 1, in: CGRect(x: 0, y: 0, width: 100, height: 1_000), name: "row", diffingOptions: nil))
        XCTAssertEqual(region.cut(atHeight: 1_000), region)
        let cut = try XCTUnwrap(region.cut(atHeight: 100))
        XCTAssertEqual([cut.y, cut.height, cut.width], [90, 10, 10])
        XCTAssertEqual(cut.name, "row")
        XCTAssertNil(region.cut(atHeight: 90))
    }

    func testInvalidFullPageOptionsAreRejected() {
        let invalid: [(Int, TimeInterval)] = [(0, 0.5), (-1, 0.5), (10, -1), (10, .nan), (10, .infinity)]
        for (limit, delay) in invalid {
            XCTAssertThrowsError(try FullPageScreenshot.validate(scrollLimit: limit, delayAfterScroll: delay), "\(limit), \(delay)") {
                XCTAssertEqual($0 as? VisualError, .invalidCheckOptions)
            }
        }
        XCTAssertNoThrow(try FullPageScreenshot.validate(scrollLimit: 1, delayAfterScroll: 0))
        XCTAssertNoThrow(try FullPageScreenshot.validate(scrollLimit: 10, delayAfterScroll: 0.5))
    }

    func testCheckUploadsTheStitchedImageAndCutsRegions() async throws {
        let buildID = "0f8fad5b-d9cb-469f-a165-70867728950e"
        let uploadURL = "https://storage.test/upload?signature=abc"
        let route = StubURLProtocol.Route([
            .json(["data": ["result": ["id": buildID, "name": "Build", "status": "RUNNING", "url": "http://build"]]]),
            .json(["data": ["result": ["id": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "imageUploadUrl": uploadURL]]]),
            StubURLProtocol.Reply(body: Data()),
            .json(["data": ["result": ["id": "16fd2706-8baf-433b-82eb-8c7fada847da"]]])
        ])
        let client = try VisualClient(
            credentials: nil, region: nil, options: VisualBuildOptions(name: "Build"),
            session: StubURLProtocol.session(route),
            environment: ["SAUCE_USERNAME": "user", "SAUCE_ACCESS_KEY": "secret", "SAUCE_REGION": "staging"],
            store: SharedBuildStore(), uploader: PresignedUploader(configuration: StubURLProtocol.configuration(route))
        )
        var request = SnapshotRequest()
        request.clip = clip
        request.fullPage = FullPageCapture.Frames(
            pngs: [try screen(scrolledTo: 200, indicator: 1), try screen(scrolledTo: 400, indicator: 2)],
            newRows: [200, 200]
        )
        // Starts inside the 600 stitched rows and reaches past them.
        let wide = try XCTUnwrap(PixelRegion(
            CGRect(x: 0, y: 550, width: 10, height: 100), scale: 1, in: CGRect(x: 0, y: 0, width: 40, height: 2_000),
            name: nil, diffingOptions: nil
        ))
        request.regions = [wide]

        _ = try await client.check(name: "Page", png: try screen(scrolledTo: 0, indicator: 0), request: request)

        let put = try XCTUnwrap(route.requests.first { $0.url?.absoluteString == uploadURL })
        XCTAssertEqual(try contentRows(of: try XCTUnwrap(put.httpBody)), Array(0..<contentHeight))
        let snapshotBody = try XCTUnwrap(route.bodies.last)
        let input = try XCTUnwrap((snapshotBody["variables"] as? [String: Any])?["input"] as? [String: Any])
        let regions = try XCTUnwrap(input["ignoreRegions"] as? [[String: Any]])
        XCTAssertEqual(regions.first?["y"] as? Int, 550)
        XCTAssertEqual(regions.first?["height"] as? Int, 50, "Cut at the stitched height")
    }

    // MARK: - Helpers

    /// A 350-row screen: a header, 200 rows of content starting at `offset`, and a footer. A strip on the
    /// right changes with `indicator`, like a scroll indicator.
    private func screen(scrolledTo offset: Int, indicator: Int) throws -> Data {
        let height = 350
        var pixels = [UInt8](repeating: 255, count: width * height * 4)
        for y in 0..<height {
            for x in 0..<width {
                let i = (y * width + x) * 4
                if x >= width - 2 {
                    pixels[i] = UInt8(indicator * 40)
                    pixels[i + 1] = 200
                    pixels[i + 2] = 200
                } else if (100..<300).contains(y) {
                    // Each content row has its own colour, so rows can be told apart.
                    let row = offset + y - 100
                    pixels[i] = UInt8(row % 256)
                    pixels[i + 1] = UInt8(row / 256)
                    pixels[i + 2] = 7
                } else {
                    pixels[i] = 50
                    pixels[i + 1] = 50
                    pixels[i + 2] = 50
                }
            }
        }
        let image = try XCTUnwrap(pixels.withUnsafeMutableBytes { buffer in
            CGContext(
                data: buffer.baseAddress, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
                space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
            )?.makeImage()
        })
        return try Screenshot.encode(image)
    }

    /// The content row each image row shows, read from its first pixel.
    private func contentRows(of png: Data) throws -> [Int] {
        let image = try Screenshot.decode(png)
        var pixels = [UInt8](repeating: 0, count: image.width * image.height * 4)
        pixels.withUnsafeMutableBytes { buffer in
            CGContext(
                data: buffer.baseAddress, width: image.width, height: image.height, bitsPerComponent: 8,
                bytesPerRow: image.width * 4, space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
            )?.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        }
        return (0..<image.height).map { row in
            let i = row * image.width * 4
            return Int(pixels[i]) + Int(pixels[i + 1]) * 256
        }
    }
}
