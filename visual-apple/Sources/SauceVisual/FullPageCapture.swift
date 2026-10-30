import CoreGraphics
import Foundation
import XCTest

/// Scrolls an element and stitches its screenshots into one image.
internal enum FullPageCapture {
    /// A screenshot taken after scrolling, and how far the content moved since the one before.
    struct Frame: Hashable, Sendable {
        var png: Data
        var shift: Shift
    }

    /// How far the content moved between two screenshots.
    struct Shift: Hashable, Sendable {
        /// How many rows the content moved up.
        var rows: Int
        /// The rows at the top of the later screenshot that don't show the content, like a status bar drawn over it.
        var coveredTop: Int
    }

    /// Scroll indicators appear along the right edge, so that strip is left out when comparing rows.
    private static let indicatorWidth: CGFloat = 12

    /// Scrolls `element` until `limit` screenshots are taken or the content stops moving.
    /// `first` is the screenshot already taken, and `clip` the element's visible part in its pixels.
    @MainActor
    static func capture(
        _ element: XCUIElement, first: Screenshot.Capture, clip: CGRect, limit: Int, delay: TimeInterval
    ) throws -> [Frame] {
        let ignoredRight = Int(exactly: (indicatorWidth * first.scale).rounded()) ?? 0
        var previous = try rows(of: first.png, in: clip, ignoringRight: ignoredRight)
        var frames: [Frame] = []
        for _ in 1..<limit {
            try Task.checkCancellation()
            let expected = scroll(element, visible: clip, scale: first.scale)
            if delay > 0 { RunLoop.current.run(until: Date(timeIntervalSinceNow: delay)) }
            let next = try settledScreenshot(clip: clip)
            // A rotated or resized screen can't be stitched.
            guard next.pixelSize == first.pixelSize else { throw VisualError.screenshotFailed }
            let current = try rows(of: next.png, in: clip, ignoringRight: ignoredRight)
            guard let shift = offset(from: previous, to: current, expected: expected) else {
                print("Sauce Visual: stopped scrolling, because the screenshots didn't line up.")
                break
            }
            guard shift.rows > 0 else { break }
            frames.append(Frame(png: next.png, shift: shift))
            previous = current
        }
        return frames
    }

    /// Waits until the scrollable area has looked the same for a second, so scroll indicators have faded
    /// and animations have finished. Gives up after `timeout` seconds and returns the latest screenshot.
    @MainActor
    private static func settledScreenshot(clip: CGRect, timeout: TimeInterval = 3) throws -> Screenshot.Capture {
        var latest = Screenshot.capture()
        var latestRows = try rows(of: latest.png, in: clip, ignoringRight: 0)
        var unchangedSince = Date()
        let deadline = Date(timeIntervalSinceNow: timeout)
        while Date() < deadline, Date().timeIntervalSince(unchangedSince) < 1 {
            RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.25))
            let next = Screenshot.capture()
            let nextRows = try rows(of: next.png, in: clip, ignoringRight: 0)
            if nextRows != latestRows { unchangedSince = Date() }
            latest = next
            latestRows = nextRows
        }
        return latest
    }

    /// Scrolls the content up by half the visible part, so screenshots overlap even under bars drawn over it.
    /// Returns the expected movement in pixels.
    @MainActor
    private static func scroll(_ element: XCUIElement, visible clip: CGRect, scale: CGFloat) -> Int {
        let visible = CGRect(x: clip.minX / scale, y: clip.minY / scale, width: clip.width / scale, height: clip.height / scale)
        let distance = visible.height * 0.5
        #if os(macOS)
        element.scroll(byDeltaX: 0, deltaY: -distance)
        #elseif os(iOS)
        let frame = element.frame
        let start = element.coordinate(withNormalizedOffset: .zero)
            .withOffset(CGVector(dx: visible.midX - frame.minX, dy: visible.minY + visible.height * 0.8 - frame.minY))
        let end = start.withOffset(CGVector(dx: 0, dy: -distance))
        // Holding at the end stops momentum, so the content moves by about the dragged distance.
        start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
        #endif
        return Int(exactly: (distance * scale).rounded()) ?? 0
    }

    /// A fingerprint of each pixel row of `clip`, leaving out `ignoringRight` pixels on the right.
    static func rows(of png: Data, in clip: CGRect, ignoringRight: Int) throws -> [UInt64] {
        guard let image = try Screenshot.decode(png).cropping(to: clip) else { throw VisualError.screenshotFailed }
        let width = image.width
        let height = image.height
        let bytesPerRow = width * 4
        guard let context = CGContext(
            data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { throw VisualError.screenshotFailed }
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let data = context.data else { throw VisualError.screenshotFailed }
        let pixels = UnsafeRawBufferPointer(start: data, count: bytesPerRow * height)
        let compared = max(1, width - ignoringRight) * 4
        // The context's memory starts with the top row.
        return (0..<height).map { row in
            var hash: UInt64 = 0xcbf2_9ce4_8422_2325
            let start = row * bytesPerRow
            var offset = start
            while offset + 8 <= start + compared {
                hash = (hash ^ pixels.loadUnaligned(fromByteOffset: offset, as: UInt64.self)) &* 0x100_0000_01b3
                offset += 8
            }
            while offset < start + compared {
                hash = (hash ^ UInt64(pixels[offset])) &* 0x100_0000_01b3
                offset += 1
            }
            return hash
        }
    }

    /// How the content moved between two screenshots: 0 rows when it didn't move, and `nil` when no shift
    /// explains the change.
    ///
    /// Bars drawn over the content, like the status bar or Safari's toolbar, don't move with it. So each shift
    /// is scored on its best stretch of overlapping rows, where at least 80% match. The shift whose stretch
    /// covers most of the overlap wins, and among equally good shifts the one closest to `expected`. Blank rows
    /// match anywhere, so a stretch with too little detail doesn't count.
    static func offset(from previous: [UInt64], to current: [UInt64], expected: Int) -> Shift? {
        let height = min(previous.count, current.count)
        guard height > 0 else { return nil }
        if previous == current { return Shift(rows: 0, coveredTop: 0) }
        // At least a fifth of the rows must overlap, and a tenth must match with some detail, for a match to
        // mean anything.
        let maximumShift = height - max(1, height / 5)
        let minimumStretch = max(1, height / 10)
        let minimumDetail = max(2, height / 200)
        guard maximumShift >= 1 else { return nil }
        var best: (shift: Shift, coverage: Double)?
        for shift in 1...maximumShift {
            guard let stretch = bestStretch(previous, current, shift: shift, height: height),
                  stretch.length >= minimumStretch, stretch.detail >= minimumDetail else { continue }
            let coverage = Double(stretch.length) / Double(height - shift)
            if let leader = best {
                let clearlyBetter = coverage > leader.coverage + 0.02
                let asGood = abs(coverage - leader.coverage) <= 0.02
                let closer = abs(shift - expected) < abs(leader.shift.rows - expected)
                guard clearlyBetter || (asGood && closer) else { continue }
            }
            best = (Shift(rows: shift, coveredTop: stretch.start), coverage)
        }
        return best?.shift
    }

    /// The best stretch of overlapping rows, in `current`, where at least 80% of the rows match.
    /// `detail` counts the matching rows that differ from the row above, so blank rows don't count.
    private static func bestStretch(
        _ previous: [UInt64], _ current: [UInt64], shift: Int, height: Int
    ) -> (start: Int, length: Int, detail: Int)? {
        // Each mismatch cancels four matches, so a stretch with a positive total is over 80% matches.
        var best: (start: Int, length: Int, detail: Int, total: Int)?
        var start = 0
        var total = 0
        var detail = 0
        for row in 0..<(height - shift) {
            if total <= 0 {
                start = row
                total = 0
                detail = 0
            }
            if current[row] == previous[row + shift] {
                total += 1
                if row > start, current[row] != current[row - 1] { detail += 1 }
            } else {
                total -= 4
            }
            if total > 0, total > best?.total ?? 0 {
                best = (start, row - start + 1, detail, total)
            }
        }
        return best.map { ($0.start, $0.length, $0.detail) }
    }

    /// The first screenshot's `clip`, with each later screenshot drawn over it, lower by the rows it moved and
    /// without its covered top, as a PNG. So bars drawn over the content only show at the top and bottom.
    static func stitch(first: Data, frames: [Frame], clip: CGRect) throws -> Data {
        let slices = try ([first] + frames.map(\.png)).map { png -> CGImage in
            guard let slice = try Screenshot.decode(png).cropping(to: clip) else { throw VisualError.screenshotFailed }
            return slice
        }
        let width = slices[0].width
        let height = slices[0].height + addedHeight(frames)
        guard slices.allSatisfy({ $0.width == width && $0.height == slices[0].height }),
              frames.allSatisfy({ (1...slices[0].height).contains($0.shift.rows) }),
              frames.allSatisfy({ (0..<slices[0].height).contains($0.shift.coveredTop) }),
              let context = CGContext(
                  data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
                  space: slices[0].colorSpace ?? CGColorSpaceCreateDeviceRGB(),
                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
              ) else { throw VisualError.screenshotFailed }
        // Core Graphics counts from the bottom, so a lower part has a smaller y.
        context.draw(slices[0], in: CGRect(x: 0, y: height - slices[0].height, width: width, height: slices[0].height))
        var offset = 0
        for (frame, slice) in zip(frames, slices.dropFirst()) {
            offset += frame.shift.rows
            let visible = slice.height - frame.shift.coveredTop
            guard let part = slice.cropping(to: CGRect(x: 0, y: frame.shift.coveredTop, width: width, height: visible)) else {
                throw VisualError.screenshotFailed
            }
            context.draw(part, in: CGRect(x: 0, y: height - offset - slice.height, width: width, height: visible))
        }
        guard let image = context.makeImage() else { throw VisualError.screenshotFailed }
        return try Screenshot.encode(image)
    }

    /// How many rows the later screenshots add below the first.
    static func addedHeight(_ frames: [Frame]) -> Int {
        frames.reduce(0) { $0 + $1.shift.rows }
    }
}
