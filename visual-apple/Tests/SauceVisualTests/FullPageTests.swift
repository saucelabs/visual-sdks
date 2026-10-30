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

        var frames: [FullPageCapture.Frame] = []
        for index in 1..<rows.count {
            let shift = try XCTUnwrap(FullPageCapture.offset(from: rows[index - 1], to: rows[index], expected: 120))
            guard shift.rows != 0 else { break }
            frames.append(.init(png: screens[index], shift: shift))
        }

        XCTAssertEqual(frames.map(\.shift.rows), [120, 120, 120, 40])
        XCTAssertEqual(frames.map(\.shift.coveredTop), [0, 0, 0, 0])
        let stitched = try FullPageCapture.stitch(first: screens[0], frames: frames, clip: clip)
        XCTAssertEqual(try contentRows(of: stitched), Array(0..<contentHeight))
    }

    func testBlankRowsAloneDontLineUp() {
        let blank = [UInt64](repeating: 7, count: 100)
        XCTAssertEqual(FullPageCapture.offset(from: blank, to: blank, expected: 37)?.rows, 0, "Nothing moved")
        var page = blank
        page[0] = 1
        XCTAssertNil(FullPageCapture.offset(from: page, to: blank, expected: 37), "Any shift would do")
    }

    func testTheExpectedShiftWinsAmongEquallyGoodOnes() {
        // Two bands repeat every 50 rows, so shifts of 50 and 100 both line up.
        let pattern = (0..<50).map { UInt64($0) }
        let page = pattern + pattern + pattern + pattern
        XCTAssertEqual(FullPageCapture.offset(from: page, to: page.shiftedUp(by: 50), expected: 90)?.rows, 100)
        XCTAssertEqual(FullPageCapture.offset(from: page, to: page.shiftedUp(by: 50), expected: 60)?.rows, 50)
    }

    func testAPinnedBandAtTheTopStillLinesUp() {
        // 20 of 200 rows stay put while the content scrolls by 80, like a pinned header or the status bar.
        let header = (0..<20).map { UInt64(1_000_000 + $0) }
        let previous = header + (20..<200).map { UInt64($0) }
        let current = header + (100..<280).map { UInt64($0) }
        XCTAssertEqual(FullPageCapture.offset(from: previous, to: current, expected: 80), .init(rows: 80, coveredTop: 20))
    }

    func testBarsDrawnOverTheContentStillLineUp() throws {
        // Like Safari: the content scrolls by 100 under a 30-row bar at the top, while a 40-row toolbar at the
        // bottom shrinks to 15 rows. Only 30 of the 100 overlapping rows match.
        let previous = (0..<160).map { UInt64($0) } + [UInt64](repeating: 9_000, count: 40)
        let current = [UInt64](repeating: 8_000, count: 30) + (130..<285).map { UInt64($0) } + [UInt64](repeating: 9_001, count: 15)
        XCTAssertEqual(FullPageCapture.offset(from: previous, to: current, expected: 110), .init(rows: 100, coveredTop: 30))

        // Stitched, the top bar is left out and the old toolbar is drawn over, so only the last toolbar shows.
        let first = try screen(scrolledTo: 0, indicator: 0, bars: (top: 0, bottom: 40))
        let second = try screen(scrolledTo: 100, indicator: 0, bars: (top: 30, bottom: 15))
        let frames = [FullPageCapture.Frame(png: second, shift: .init(rows: 100, coveredTop: 30))]
        let stitched = try FullPageCapture.stitch(first: first, frames: frames, clip: clip)
        XCTAssertEqual(try contentRows(of: stitched), Array(0..<285) + [Int](repeating: Self.barRow, count: 15))
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
        request.fullPage = [
            .init(png: try screen(scrolledTo: 200, indicator: 1), shift: .init(rows: 200, coveredTop: 0)),
            .init(png: try screen(scrolledTo: 400, indicator: 2), shift: .init(rows: 200, coveredTop: 0))
        ]
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

    /// The value `contentRows` reads for a bar drawn over the content.
    private static let barRow = 4_000

    /// A 350-row screen: a header, 200 rows of content starting at `offset`, and a footer. A strip on the
    /// right changes with `indicator`, like a scroll indicator. `bars` cover the top and bottom of the content.
    private func screen(scrolledTo offset: Int, indicator: Int, bars: (top: Int, bottom: Int) = (0, 0)) throws -> Data {
        let height = 350
        var pixels = [UInt8](repeating: 255, count: width * height * 4)
        for y in 0..<height {
            for x in 0..<width {
                let i = (y * width + x) * 4
                if x >= width - 2 {
                    pixels[i] = UInt8(indicator * 40)
                    pixels[i + 1] = 200
                    pixels[i + 2] = 200
                } else if (100..<(100 + bars.top)).contains(y) || ((300 - bars.bottom)..<300).contains(y) {
                    pixels[i] = UInt8(Self.barRow % 256)
                    pixels[i + 1] = UInt8(Self.barRow / 256)
                    pixels[i + 2] = 7
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

private extension Array where Element == UInt64 {
    /// The rows after scrolling up by `rows`, with new, different rows coming in at the bottom.
    func shiftedUp(by rows: Int) -> [UInt64] {
        Array(dropFirst(rows)) + (0..<rows).map { UInt64(10_000 + $0) }
    }
}
