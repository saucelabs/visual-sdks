#if canImport(ObjectiveC)
import Foundation

/// Immutable Objective-C representation of a committed mock checkpoint.
@objc(SLVCheckpointReceipt)
public final class VisualCheckpointReceipt: NSObject, Sendable {
    /// Session name after whitespace/newline trimming.
    @objc public let sessionName: String
    /// Checkpoint name after whitespace/newline trimming.
    @objc public let checkpointName: String
    /// One-based commit order within this session.
    @objc public let sequence: Int
    /// Always true: no screenshot or visual comparison was performed.
    @objc public var isMock: Bool { true }

    internal init(_ value: CheckpointReceipt) {
        sessionName = value.sessionName
        checkpointName = value.checkpointName
        sequence = value.sequence
        super.init()
    }
}
#endif
