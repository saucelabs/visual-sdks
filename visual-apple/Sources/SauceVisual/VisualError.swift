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
    case invalidSnapshotName = 8
    case elementNotFound = 9
    case clipElementOffScreen = 10
    case screenshotFailed = 11

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
        case .invalidSnapshotName:
            return "Invalid snapshot name. Give the snapshot a name that is not empty."
        case .elementNotFound:
            return "An element in the check options doesn't exist. Wait for it before the check, or remove it."
        case .clipElementOffScreen:
            return "The clip element is off screen. Scroll it into view before the check."
        case .screenshotFailed:
            return "Could not process the screenshot."
        }
    }

    public var description: String { errorDescription ?? "Visual SDK error." }

    public var errorUserInfo: [String: Any] {
        [NSLocalizedDescriptionKey: errorDescription ?? "Visual SDK error."]
    }
}
