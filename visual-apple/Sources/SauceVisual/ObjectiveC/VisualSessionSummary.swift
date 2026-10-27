#if canImport(ObjectiveC)
import Foundation

/// Immutable Objective-C representation of a finished mock session.
@objc(SLVSessionSummary)
public final class VisualSessionSummary: NSObject, Sendable {
    /// Session name after whitespace/newline trimming.
    @objc public let sessionName: String
    /// Number of successfully committed checkpoints.
    @objc public let checkpointCount: Int
    /// Always true: no backend session was created or completed.
    @objc public var isMock: Bool { true }

    internal init(_ value: SessionSummary) {
        sessionName = value.sessionName
        checkpointCount = value.checkpointCount
        super.init()
    }
}
#endif
