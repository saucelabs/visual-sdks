#if canImport(ObjectiveC)
import Foundation

/// Objective-C numeric error contract. Values match VisualError exactly.
@objc(SLVErrorCode)
public enum VisualErrorCode: Int, Sendable {
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
}
#endif
