#if canImport(ObjectiveC)
/// Objective-C error codes in the `com.saucelabs.visual.apple` NSError domain.
///
/// Keep this separate from `VisualError`: an @objc enum conforming to Error receives compiler-generated NSError bridging that overrides CustomNSError's domain on Apple platforms.
/// The Swift error supplies the domain and message: this enum supplies the stable constants in the generated Objective-C header.
@objc(SLVErrorCode)
public enum VisualErrorCode: Int, Sendable {
    case invalidSessionName = 1
    case invalidCheckpointName = 2
    case invalidCheckpointLimit = 3
    case sessionFinished = 4
    case checkpointLimitReached = 5
    case cancelled = 6
}
#endif
