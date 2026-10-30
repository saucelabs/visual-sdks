import Foundation

/// SDK errors. The codes are public: never renumber or reuse one, and add new codes at the end.
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

    public static var errorDomain: String { "com.saucelabs.visual.apple" }
    public var errorCode: Int { rawValue }

    public var errorDescription: String? {
        switch self {
        case .cancelled:
            return "The operation was cancelled."
        case .invalidCredentials:
            return "Invalid Sauce Labs credentials. Check your username and access key."
        case .unknownRegion:
            return "Unknown Sauce Labs region. Check the region name or SAUCE_REGION."
        case .invalidBuildId:
            return "Invalid Sauce Visual build ID. Check that it is a UUID."
        case .buildAlreadyCompleted:
            return "The Sauce Visual build is already finished. Start a new build to add snapshots."
        case .networkFailure:
            return "Could not reach the Sauce Visual API."
        case .apiError:
            return "The Sauce Visual API returned an error."
        case .conflictingConfiguration:
            return "Another Sauce Visual client in this process uses a different region, credentials, or build options. Every client in a test run must use the same ones."
        case .buildNotFound:
            return "No Sauce Visual build has this build ID. Check the buildId option or SAUCE_VISUAL_BUILD_ID."
        case .invalidSnapshotName:
            return "Invalid snapshot name. Give the snapshot a name that is not empty."
        case .elementNotFound:
            return "An element in the check options doesn't exist. Wait for it before the check, or remove it."
        case .invalidCheckOptions:
            return "Invalid check options. Regions need a finite position and a positive size, tolerance values must be between 0 and 1, and minChangeSize can't be negative."
        case .clipElementOffScreen:
            return "The clip or full-page element is off screen. Scroll it into view before the check."
        case .screenshotFailed:
            return "Could not process the screenshot."
        case .fullPageNotSupported:
            return "Full-page screenshots aren't available on tvOS."
        }
    }

    public var description: String { errorDescription ?? "Visual SDK error." }

    public var errorUserInfo: [String: Any] {
        [NSLocalizedDescriptionKey: errorDescription ?? "Visual SDK error."]
    }
}
