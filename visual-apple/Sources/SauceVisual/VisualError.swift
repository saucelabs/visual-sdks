import Foundation

/// Stable, non-sensitive failures.
/// Cancellation of a Swift call throws `CancellationError`, the Objective-C adapter maps it to `.cancelled`.
public enum VisualError: Int, Error, Sendable, CustomNSError, LocalizedError {
    case invalidSessionName = 1
    case invalidCheckpointName = 2
    case invalidCheckpointLimit = 3
    case sessionFinished = 4
    case checkpointLimitReached = 5
    case cancelled = 6

    public static var errorDomain: String { "com.saucelabs.visual.apple" }
    public var errorCode: Int { rawValue }

    public var errorDescription: String? {
        switch self {
        case .invalidSessionName:
            return "Session name must contain 1–200 UTF-8 bytes after trimming whitespace."
        case .invalidCheckpointName:
            return "Checkpoint name must contain 1–200 UTF-8 bytes after trimming whitespace."
        case .invalidCheckpointLimit:
            return "Maximum checkpoints must be greater than zero."
        case .sessionFinished:
            return "The mock visual session has already finished."
        case .checkpointLimitReached:
            return "The mock visual session has reached its checkpoint limit."
        case .cancelled:
            return "The operation was cancelled before committing a change."
        }
    }

    public var errorUserInfo: [String: Any] {
        [NSLocalizedDescriptionKey: errorDescription ?? "Visual SDK error."]
    }
}
