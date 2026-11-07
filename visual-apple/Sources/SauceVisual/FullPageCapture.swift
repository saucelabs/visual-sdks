import CoreGraphics
import Foundation
import XCTest
#if os(macOS)
import AppKit
#endif

/// Bounded scroll capture. Unsupported/ambiguous captures fail instead of uploading a guessed prefix.
internal enum FullPageCapture {
    typealias Shift = ScrollAlignment.Shift

    struct Frame: Hashable, Sendable {
        var png: Data
        var shift: Shift
    }

    struct Result: Sendable {
        let first: Data
        let frames: [Frame]
        let extent: VisualCaptureExtent
    }

    @MainActor
    private static var indicatorWidth: CGFloat {
        #if os(macOS)
        // A persistent desktop scroller is wider than the mobile overlay indicator. Its moving
        // thumb must not enter the row fingerprints used to measure the content's displacement.
        return max(12, NSScroller.scrollerWidth(for: .regular, scrollerStyle: .legacy))
        #else
        return 12
        #endif
    }

    @MainActor
    static func capture(
        _ element: XCUIElement, first: Screenshot.Capture, clip: CGRect,
        limit: Int, delay: TimeInterval, allowPartialAtLimit: Bool,
        maximumPixels: Int, maximumDuration: TimeInterval
    ) async throws -> Result {
        try Task.checkCancellation()
        let deadline = Deadline(seconds: maximumDuration)
        guard let width = Int(exactly: clip.width), let baseHeight = Int(exactly: clip.height) else {
            throw VisualError.screenshotFailed
        }
        try CaptureLimits.dimensions(width: width, height: baseHeight, maximumPixels: maximumPixels)
        try validateFrame(element, clip: clip, screenshot: first)
        let stableFirst = try await settledScreenshot(clip: clip, deadline: deadline)
        guard stableFirst.pixelSize == first.pixelSize, stableFirst.scale == first.scale else {
            throw VisualError.screenshotFailed
        }
        try validateFrame(element, clip: clip, screenshot: stableFirst)
        let ignoredRight = Int(exactly: (indicatorWidth * first.scale).rounded()) ?? 0
        var previous = try await fingerprint(stableFirst.png, clip: clip, ignoredRight: ignoredRight)
        var frames: [Frame] = []
        var outputHeight = baseHeight
        var inputBytes = stableFirst.png.count
        guard inputBytes <= CaptureLimits.maximumInputBytes else { throw VisualError.captureBudgetExceeded }

        for _ in 1..<limit {
            try deadline.check()
            try validateFrame(element, clip: clip, screenshot: stableFirst)
            let expected = scroll(element, visible: clip, scale: first.scale)
            try await deadline.sleep(seconds: delay)
            let next = try await settledScreenshot(clip: clip, deadline: deadline)
            guard next.pixelSize == first.pixelSize, next.scale == first.scale else { throw VisualError.screenshotFailed }
            try validateFrame(element, clip: clip, screenshot: next)
            let current = try await fingerprint(next.png, clip: clip, ignoredRight: ignoredRight)
            guard let shift = try await measure(previous, current, expected: expected) else {
                throw VisualError.captureAlignmentFailed
            }
            try deadline.check()
            if shift.rows == 0 {
                return Result(first: stableFirst.png, frames: frames, extent: .noMovementDetected)
            }
            outputHeight = try CaptureLimits.adding(outputHeight, shift.rows)
            try CaptureLimits.dimensions(width: width, height: outputHeight, maximumPixels: maximumPixels)
            inputBytes = try CaptureLimits.adding(inputBytes, next.png.count)
            guard inputBytes <= CaptureLimits.maximumInputBytes else { throw VisualError.captureBudgetExceeded }
            frames.append(Frame(png: next.png, shift: shift))
            previous = current
        }
        guard allowPartialAtLimit else { throw VisualError.captureLimitReached }
        return Result(first: stableFirst.png, frames: frames, extent: .limitReached)
    }

    @MainActor
    private static func validateFrame(_ element: XCUIElement, clip: CGRect, screenshot: Screenshot.Capture) throws {
        try Task.checkCancellation()
        guard element.exists else { throw VisualError.elementNotFound }
        let bounds = CGRect(origin: .zero, size: screenshot.pixelSize)
        guard PixelRegion.pixels(element.frame, scale: screenshot.scale, in: bounds) == clip else {
            // A moving/resizing viewport cannot be projected by the current vertical-only stitcher.
            throw VisualError.captureAlignmentFailed
        }
    }

    /// Exact quiescence of the visible pixels is a conservative readiness condition, not an app-idle API.
    @MainActor
    private static func settledScreenshot(clip: CGRect, deadline: Deadline) async throws -> Screenshot.Capture {
        try deadline.check()
        var latest = Screenshot.capture()
        var latestRows = try await fingerprint(latest.png, clip: clip, ignoredRight: 0)
        var unchangedSince = DispatchTime.now().uptimeNanoseconds
        let settleDeadline = Deadline(seconds: 3)
        while DispatchTime.now().uptimeNanoseconds - unchangedSince < 1_000_000_000 {
            try deadline.check()
            try settleDeadline.check()
            try await deadline.sleep(seconds: 0.25)
            let next = Screenshot.capture()
            guard next.pixelSize == latest.pixelSize, next.scale == latest.scale else { throw VisualError.screenshotFailed }
            let rows = try await fingerprint(next.png, clip: clip, ignoredRight: 0)
            if rows != latestRows { unchangedSince = DispatchTime.now().uptimeNanoseconds }
            latest = next
            latestRows = rows
        }
        try deadline.check()
        return latest
    }

    @MainActor
    private static func scroll(_ element: XCUIElement, visible clip: CGRect, scale: CGFloat) -> Int {
        let visible = CGRect(x: clip.minX / scale, y: clip.minY / scale, width: clip.width / scale, height: clip.height / scale)
        let distance = visible.height * 0.5
        #if os(macOS)
        element.scroll(byDeltaX: 0, deltaY: -distance)
        #elseif os(iOS)
        let frame = element.frame
        let start = element.coordinate(withNormalizedOffset: .zero).withOffset(
            CGVector(dx: visible.midX - frame.minX, dy: visible.minY + visible.height * 0.8 - frame.minY)
        )
        let end = start.withOffset(CGVector(dx: 0, dy: -distance))
        start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
        #endif
        return Int(exactly: (distance * scale).rounded()) ?? 0
    }

    /// Detached CPU work has bounded input and is awaited; cancellation is forwarded explicitly.
    private static func fingerprint(_ png: Data, clip: CGRect, ignoredRight: Int) async throws -> [UInt64] {
        let task = Task.detached(priority: .userInitiated) {
            try rows(of: png, in: clip, ignoringRight: ignoredRight)
        }
        return try await withTaskCancellationHandler {
            try await task.value
        } onCancel: { task.cancel() }
    }

    private static func measure(_ previous: [UInt64], _ current: [UInt64], expected: Int) async throws -> Shift? {
        let task = Task.detached(priority: .userInitiated) {
            try Task.checkCancellation()
            return offset(from: previous, to: current, expected: expected)
        }
        return try await withTaskCancellationHandler {
            let result = try await task.value
            try Task.checkCancellation()
            return result
        } onCancel: { task.cancel() }
    }

    static func offset(from previous: [UInt64], to current: [UInt64], expected: Int) -> Shift? {
        ScrollAlignment.offset(from: previous, to: current, expected: expected)
    }

    static func rows(of png: Data, in clip: CGRect, ignoringRight: Int) throws -> [UInt64] {
        try Task.checkCancellation()
        guard PixelRegion.isUsable(clip), ignoringRight >= 0,
              let image = try Screenshot.decode(png).cropping(to: clip) else { throw VisualError.screenshotFailed }
        let width = image.width
        let height = image.height
        try CaptureLimits.dimensions(width: width, height: height, maximumPixels: CaptureLimits.maximumOutputPixels)
        let bytesPerRow = width * 4
        guard let context = CGContext(
            data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { throw VisualError.screenshotFailed }
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let data = context.data else { throw VisualError.screenshotFailed }
        let pixels = UnsafeRawBufferPointer(start: data, count: bytesPerRow * height)
        let compared = max(1, width - ignoringRight) * 4
        var result: [UInt64] = []
        result.reserveCapacity(height)
        for row in 0..<height {
            if row.isMultiple(of: 32) { try Task.checkCancellation() }
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
            result.append(hash)
        }
        return result
    }

    /// Decode and draw one frame at a time. Validate the canvas before allocating it.
    static func stitch(
        first: Data, frames: [Frame], clip: CGRect,
        maxOutputPixels: Int = CaptureLimits.defaultOutputPixels
    ) throws -> Data {
        try Task.checkCancellation()
        guard let width = Int(exactly: clip.width), let baseHeight = Int(exactly: clip.height),
              PixelRegion.isUsable(clip), frames.count < CaptureLimits.maximumFrames else {
            throw VisualError.captureBudgetExceeded
        }
        var height = baseHeight
        var inputBytes = first.count
        for frame in frames {
            guard frame.shift.rows > 0, frame.shift.rows <= baseHeight,
                  frame.shift.coveredTop >= 0,
                  frame.shift.coveredTop <= baseHeight - frame.shift.rows else {
                throw VisualError.captureAlignmentFailed
            }
            height = try CaptureLimits.adding(height, frame.shift.rows)
            inputBytes = try CaptureLimits.adding(inputBytes, frame.png.count)
        }
        guard inputBytes <= CaptureLimits.maximumInputBytes else { throw VisualError.captureBudgetExceeded }
        try CaptureLimits.dimensions(width: width, height: height, maximumPixels: maxOutputPixels)
        let outputSpace: CGColorSpace = try autoreleasepool {
            let firstImage = try Screenshot.decode(first)
            if let colorSpace = firstImage.colorSpace, colorSpace.model == .rgb { return colorSpace }
            guard let fallback = CGColorSpace(name: CGColorSpace.sRGB) else { throw VisualError.screenshotFailed }
            return fallback
        }
        guard let context = CGContext(
            data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
            space: outputSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { throw VisualError.screenshotFailed }

        func draw(_ png: Data, offset: Int, coveredTop: Int) throws {
            try Task.checkCancellation()
            try autoreleasepool {
                guard let slice = try Screenshot.decode(png).cropping(to: clip),
                      slice.width == width, slice.height == baseHeight,
                      let visible = slice.cropping(to: CGRect(
                        x: 0, y: coveredTop, width: width, height: baseHeight - coveredTop
                      )) else { throw VisualError.screenshotFailed }
                context.draw(visible, in: CGRect(
                    x: 0, y: height - offset - baseHeight, width: width, height: baseHeight - coveredTop
                ))
            }
        }
        try draw(first, offset: 0, coveredTop: 0)
        var offset = 0
        for frame in frames {
            offset = try CaptureLimits.adding(offset, frame.shift.rows)
            try draw(frame.png, offset: offset, coveredTop: frame.shift.coveredTop)
        }
        guard let image = context.makeImage() else { throw VisualError.screenshotFailed }
        try Task.checkCancellation()
        return try Screenshot.encode(image)
    }

    /// Compatibility helper for existing internal tests; rendering uses checked arithmetic above.
    static func addedHeight(_ frames: [Frame]) -> Int {
        frames.reduce(0) { value, frame in
            let next = value.addingReportingOverflow(frame.shift.rows)
            return next.overflow ? Int.max : next.partialValue
        }
    }

    private struct Deadline: Sendable {
        let end: UInt64
        init(seconds: TimeInterval) {
            let bounded = min(max(seconds, 0), CaptureLimits.maximumDuration)
            end = DispatchTime.now().uptimeNanoseconds + UInt64(bounded * 1_000_000_000)
        }
        func check() throws {
            try Task.checkCancellation()
            guard DispatchTime.now().uptimeNanoseconds < end else { throw VisualError.captureTimedOut }
        }
        func sleep(seconds: TimeInterval) async throws {
            try check()
            let now = DispatchTime.now().uptimeNanoseconds
            let requested = UInt64(min(max(seconds, 0), CaptureLimits.maximumDuration) * 1_000_000_000)
            guard requested < end - min(now, end) else { throw VisualError.captureTimedOut }
            if requested > 0 { try await Task.sleep(nanoseconds: requested) }
            try check()
        }
    }
}
