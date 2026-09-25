#if canImport(ObjectiveC)
/// Objective-C error codes in the `com.saucelabs.visual.apple` NSError domain.
///
/// Keep this separate from `VisualError`: an @objc enum conforming to Error receives compiler-generated NSError bridging that overrides CustomNSError's domain on Apple platforms.
/// The Swift error supplies the domain and message: this enum supplies the stable constants in the generated Objective-C header.
@objc(SLVErrorCode)
public enum VisualErrorCode: Int, Sendable {
    case cancelled = 1
    case invalidCredentials = 2
    case unknownRegion = 3
    case invalidBuildId = 4
    case buildAlreadyCompleted = 5
    case networkFailure = 6
    case apiError = 7
}
#endif
