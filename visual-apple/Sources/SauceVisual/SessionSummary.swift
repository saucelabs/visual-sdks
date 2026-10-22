/// Final count for an in-memory session. This is not a backend result.
public struct SessionSummary: Equatable, Sendable {
    /// Session name after whitespace/newline trimming.
    public let sessionName: String
    /// Number of checkpoints committed before this session finished.
    public let checkpointCount: Int
    /// Always true: this summary describes an in-memory session only.
    public var isMock: Bool { true }

    internal init(sessionName: String, checkpointCount: Int) {
        self.sessionName = sessionName
        self.checkpointCount = checkpointCount
    }
}
