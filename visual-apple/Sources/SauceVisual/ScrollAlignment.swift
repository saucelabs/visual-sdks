import Foundation

/// Conservative row alignment. A gesture is an instruction, not a measured content offset.
internal enum ScrollAlignment {
    struct Shift: Hashable, Sendable {
        var rows: Int
        var coveredTop: Int
    }

    /// nil means insufficient or ambiguous evidence, never permission to guess.
    /// `expected` is retained for existing internal callers but intentionally does not break ties.
    static func offset(from previous: [UInt64], to current: [UInt64], expected: Int) -> Shift? {
        guard previous.count == current.count, previous.count >= 10, previous.count <= 8_192 else { return nil }
        let height = previous.count
        let maximumShift = height - max(1, height / 5)
        let minimumStretch = max(5, height / 10)
        let minimumDetail = max(2, height / 200)
        var candidates: [(shift: Shift, coverage: Double)] = []

        // Zero must participate even when a small dynamic region changed.
        for shift in 0...maximumShift {
            if Task.isCancelled { return nil }
            guard let stretch = bestStretch(previous, current, shift: shift),
                  stretch.length >= minimumStretch,
                  stretch.detail >= minimumDetail else { continue }
            let coverage = Double(stretch.length) / Double(height - shift)
            // Reject heavily occluded overlaps rather than infer a distance from a small band.
            guard coverage >= (shift == 0 ? 0.98 : 0.60) else { continue }
            candidates.append((Shift(rows: shift, coveredTop: shift == 0 ? 0 : stretch.start), coverage))
        }
        guard let best = candidates.map(\.coverage).max() else { return nil }
        let plausible = candidates.filter { best - $0.coverage <= 0.02 }
        guard plausible.count == 1 else { return nil }
        return plausible[0].shift
    }

    /// Longest high-quality matching band, excluding changing overlays. Each mismatch costs four
    /// matches. Detail prevents a uniform background being used as evidence of a particular shift.
    private static func bestStretch(
        _ previous: [UInt64], _ current: [UInt64], shift: Int
    ) -> (start: Int, length: Int, detail: Int)? {
        var best: (start: Int, length: Int, detail: Int, score: Int)?
        var start = 0
        var score = 0
        var detail = 0
        for row in 0..<(current.count - shift) {
            if score <= 0 {
                start = row
                score = 0
                detail = 0
            }
            if current[row] == previous[row + shift] {
                score += 1
                if row > start, current[row] != current[row - 1] { detail += 1 }
            } else {
                score -= 4
            }
            if score > 0, score > (best?.score ?? 0) {
                best = (start, row - start + 1, detail, score)
            }
        }
        return best.map { ($0.start, $0.length, $0.detail) }
    }
}

/// Client-side safety limits, not assertions about server limits or every device's available memory.
internal enum CaptureLimits {
    static let defaultOutputPixels = 20_000_000
    static let maximumOutputPixels = 32_000_000
    static let maximumInputBytes = 64 * 1_024 * 1_024
    static let maximumFrames = 100
    static let defaultDuration: TimeInterval = 60
    static let maximumDuration: TimeInterval = 300

    static func dimensions(width: Int, height: Int, maximumPixels: Int) throws {
        guard width > 0, height > 0,
              maximumPixels > 0, maximumPixels <= maximumOutputPixels else {
            throw VisualError.captureBudgetExceeded
        }
        let pixels = width.multipliedReportingOverflow(by: height)
        let bytes = pixels.partialValue.multipliedReportingOverflow(by: 4)
        guard !pixels.overflow, !bytes.overflow, pixels.partialValue <= maximumPixels else {
            throw VisualError.captureBudgetExceeded
        }
    }

    static func adding(_ left: Int, _ right: Int) throws -> Int {
        let result = left.addingReportingOverflow(right)
        guard left >= 0, right >= 0, !result.overflow else { throw VisualError.captureBudgetExceeded }
        return result.partialValue
    }
}
