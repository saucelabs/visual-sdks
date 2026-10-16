#if canImport(ObjectiveC)
/// Error codes for Objective-C, in the `com.saucelabs.visual.apple` domain. Kept apart from `VisualError`,
/// because an `@objc` error enum would get the wrong NSError domain.
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
    case clipElementOffScreen = 12
    case screenshotFailed = 13
}
#endif
