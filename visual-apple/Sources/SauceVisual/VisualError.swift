import Foundation

/// Stable NSError codes. Append new cases; never renumber or reuse an existing code.
public enum VisualError: Int, Error, Sendable, CustomNSError, LocalizedError, CustomStringConvertible {
    case cancelled = 1
    case invalidCredentials = 2
    case unknownRegion = 3
    case invalidBuildId = 4
    case buildAlreadyCompleted = 5
    case networkFailure = 6
    case apiError = 7
    case conflictingConfiguration = 8
    case buildNotFound = 9
    case invalidSnapshotName = 10
    case elementNotFound = 11
    case invalidCheckOptions = 12
    case clipElementOffScreen = 13
    case screenshotFailed = 14
    case fullPageNotSupported = 15
    case invalidFinishDelay = 16
    case captureAlignmentFailed = 17
    case captureLimitReached = 18
    case captureTimedOut = 19
    case captureBudgetExceeded = 20
    case domCaptureFailed = 21
    case unsupportedCaptureCombination = 22

    public static var errorDomain: String { "com.saucelabs.visual.apple" }
    public var errorCode: Int { rawValue }

    public var errorDescription: String? {
        switch self {
        case .cancelled: return "The operation was cancelled."
        case .invalidCredentials: return "Invalid Sauce Labs credentials. Check your username and access key."
        case .unknownRegion: return "Unknown Sauce Labs region. Check the region name or SAUCE_REGION."
        case .invalidBuildId: return "Invalid Sauce Visual build ID. Check that it is a UUID."
        case .buildAlreadyCompleted: return "The Sauce Visual run is closed. New snapshots cannot be admitted."
        case .networkFailure: return "Could not reach the Sauce Visual API."
        case .apiError: return "The Sauce Visual API returned an error."
        case .conflictingConfiguration:
            return "Another Sauce Visual client in this process uses a different region, credentials, or build options. Every client in a test run must use the same ones."
        case .buildNotFound: return "No Sauce Visual build has this build ID. Check buildId or SAUCE_VISUAL_BUILD_ID."
        case .invalidSnapshotName: return "Invalid snapshot name. Give the snapshot a name that is not empty."
        case .elementNotFound: return "An element in the check options does not exist. Wait for it before the check."
        case .invalidCheckOptions:
            return "Invalid check options. Check finite positive regions, supported flags, tolerance ranges, and capture limits."
        case .clipElementOffScreen: return "The clip or scroll element is off screen. Scroll it into view before the check."
        case .screenshotFailed: return "Could not process the screenshot."
        case .fullPageNotSupported: return "Scroll capture is not available on tvOS."
        case .invalidFinishDelay: return "Invalid finish delay. It needs a customId and a nonnegative supported number of seconds."
        case .captureAlignmentFailed: return "The screenshots do not establish a unique supported scroll alignment. No partial snapshot was submitted."
        case .captureLimitReached: return "The screenshot limit was reached. Increase the supported limit or explicitly allow a bounded prefix."
        case .captureTimedOut: return "Capture did not reach a stable result within its time budget."
        case .captureBudgetExceeded: return "The requested capture exceeds its image-size, byte, or frame budget."
        case .domCaptureFailed: return "The requested element tree could not be captured. No snapshot was submitted."
        case .unsupportedCaptureCombination:
            return "This combination of capture geometry, element-tree requirements, or scroll-region options is not supported."
        }
    }

    public var description: String { errorDescription ?? "Visual SDK error." }
    public var errorUserInfo: [String: Any] { [NSLocalizedDescriptionKey: description] }
}
