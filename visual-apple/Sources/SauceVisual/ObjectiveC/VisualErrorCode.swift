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
    case invalidSnapshotName = 8
    case elementNotFound = 9
}
#endif
