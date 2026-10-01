/// Immutable receipt for an in-memory checkpoint. Not a visual comparison result.
public struct CheckpointReceipt: Equatable, Sendable {
    /// Session name after whitespace/newline trimming.
    public let sessionName: String
    /// Checkpoint name after whitespace/newline trimming. Duplicates are allowed.
    public let checkpointName: String
    /// One-based order in which operations committed inside this session's actor.
    public let sequence: Int
    /// Always true: no screenshot or visual comparison was performed.
    public var isMock: Bool { true }

    internal init(sessionName: String, checkpointName: String, sequence: Int) {
        self.sessionName = sessionName
        self.checkpointName = checkpointName
        self.sequence = sequence
    }
}
