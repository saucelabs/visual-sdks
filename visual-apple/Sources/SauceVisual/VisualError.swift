import Foundation

/// Stable, non-sensitive failures. Codes are public API: never renumber or reuse one; add new codes at the end.
/// Cancellation of a Swift call throws `CancellationError`, the Objective-C adapter maps it to `.cancelled`.
public enum VisualError: Int, Error, Sendable, CustomNSError, LocalizedError, CustomStringConvertible {
    case cancelled = 1
    case invalidCredentials = 2
    case unknownRegion = 3
    case invalidBuildId = 4
    case buildAlreadyCompleted = 5
    case networkFailure = 6
    case apiError = 7

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
        }
    }

    public var description: String { errorDescription ?? "Visual SDK error." }

    public var errorUserInfo: [String: Any] {
        [NSLocalizedDescriptionKey: errorDescription ?? "Visual SDK error."]
    }
}
