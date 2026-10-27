import CoreGraphics
import Foundation
import XCTest

/// Scrolls an element and stitches its screenshots into one image.
internal enum FullPageCapture {
    /// The screenshots taken after the first, and how many new rows each one adds.
    struct Frames: Hashable, Sendable {
        var pngs: [Data] = []
        var newRows: [Int] = []

        var addedHeight: Int { newRows.reduce(0, +) }
    }

    /// Scroll indicators appear along the right edge, so that strip is left out when comparing rows.
    private static let indicatorWidth: CGFloat = 12

    /// Scrolls `element` until `limit` screenshots are taken or the content stops moving.
    /// `first` is the screenshot already taken, and `clip` the element's visible part in its pixels.
    @MainActor
    static func capture(
        _ element: XCUIElement, first: Screenshot.Capture, clip: CGRect, limit: Int, delay: TimeInterval
    ) throws -> Frames {
        let ignoredRight = Int(exactly: (indicatorWidth * first.scale).rounded()) ?? 0
        var previous = try rows(of: first.png, in: clip, ignoringRight: ignoredRight)
        var frames = Frames()
        for _ in 1..<limit {
            try Task.checkCancellation()
            let expected = scroll(element, visible: clip, scale: first.scale)
            if delay > 0 { RunLoop.current.run(until: Date(timeIntervalSinceNow: delay)) }
            let next = try settledScreenshot(clip: clip)
            // A rotated or resized screen can't be stitched.
            guard next.pixelSize == first.pixelSize else { throw VisualError.screenshotFailed }
            let current = try rows(of: next.png, in: clip, ignoringRight: ignoredRight)
            guard let moved = offset(from: previous, to: current, expected: expected) else {
                print("Sauce Visual: stopped scrolling, because the screenshots didn't line up.")
                break
            }
            guard moved > 0 else { break }
            frames.pngs.append(next.png)
            frames.newRows.append(moved)
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

    /// Scrolls the content up by 60% of the visible part, so screenshots overlap.
    /// Returns the expected movement in pixels.
    @MainActor
    private static func scroll(_ element: XCUIElement, visible clip: CGRect, scale: CGFloat) -> Int {
        let visible = CGRect(x: clip.minX / scale, y: clip.minY / scale, width: clip.width / scale, height: clip.height / scale)
        let distance = visible.height * 0.6
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

    /// How many rows the content moved up between two screenshots: 0 when it didn't move, and `nil` when
    /// no shift explains the change. Blank rows match anywhere, so among equally good shifts the one
    /// closest to `expected` wins.
    static func offset(from previous: [UInt64], to current: [UInt64], expected: Int) -> Int? {
        let height = min(previous.count, current.count)
        guard height > 0 else { return nil }
        if previous == current { return 0 }
        // At least a fifth of the rows must overlap for a match to mean anything.
        let maximumShift = height - max(1, height / 5)
        guard maximumShift >= 1 else { return nil }
        var best: (shift: Int, score: Double)?
        for shift in 1...maximumShift {
            let overlap = height - shift
            var matching = 0
            for row in 0..<overlap where current[row] == previous[row + shift] { matching += 1 }
            let score = Double(matching) / Double(overlap)
            guard score >= 0.8 else { continue }
            if let leader = best {
                let clearlyBetter = score > leader.score + 0.02
                let asGood = abs(score - leader.score) <= 0.02
                let closer = abs(shift - expected) < abs(leader.shift - expected)
                guard clearlyBetter || (asGood && closer) else { continue }
            }
            best = (shift, score)
        }
        return best?.shift
    }

    /// The first screenshot's `clip`, followed by the new rows of each later screenshot, as a PNG.
    static func stitch(first: Data, frames: Frames, clip: CGRect) throws -> Data {
        guard frames.pngs.count == frames.newRows.count else { throw VisualError.screenshotFailed }
        let slices = try ([first] + frames.pngs).map { png -> CGImage in
            guard let slice = try Screenshot.decode(png).cropping(to: clip) else { throw VisualError.screenshotFailed }
            return slice
        }
        let width = slices[0].width
        let height = slices[0].height + frames.addedHeight
        guard slices.allSatisfy({ $0.width == width && $0.height == slices[0].height }),
              frames.newRows.allSatisfy({ $0 > 0 && $0 <= slices[0].height }),
              let context = CGContext(
                  data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
                  space: slices[0].colorSpace ?? CGColorSpaceCreateDeviceRGB(),
                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
              ) else { throw VisualError.screenshotFailed }
        // Core Graphics counts from the bottom, so each part is placed below the previous one.
        var top = slices[0].height
        context.draw(slices[0], in: CGRect(x: 0, y: height - top, width: width, height: slices[0].height))
        for (slice, rows) in zip(slices.dropFirst(), frames.newRows) {
            guard let part = slice.cropping(to: CGRect(x: 0, y: slice.height - rows, width: width, height: rows)) else {
                throw VisualError.screenshotFailed
            }
            top += rows
            context.draw(part, in: CGRect(x: 0, y: height - top, width: width, height: rows))
        }
        guard let image = context.makeImage() else { throw VisualError.screenshotFailed }
        return try Screenshot.encode(image)
    }
}
