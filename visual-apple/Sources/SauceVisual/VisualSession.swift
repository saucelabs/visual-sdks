import Foundation

/// A concurrency-safe integration skeleton, NOT a connection to Sauce Visual.
///
/// Each instance is independent. The actor retains only its validated session name, limit, count, and terminal state: it does not retain checkpoint names.
/// Operations contain no suspension between their cancellation check and commit.
/// Calls may race: ordering means actor execution order, not task creation order.
public actor VisualSession {
    /// Validated session name, readable without entering the actor.
    public nonisolated let sessionName: String
    /// Positive upper bound on the number of committed checkpoints.
    public nonisolated let maximumCheckpoints: Int
    private var checkpointCount = 0
    private var finished = false

    /// Names are trimmed and must contain 1–200 UTF-8 bytes.
    /// - Throws: `VisualError.invalidSessionName` or `.invalidCheckpointLimit`.
    public init(sessionName: String, maximumCheckpoints: Int = 10_000) throws {
        self.sessionName = try Self.validatedName(sessionName, error: .invalidSessionName)
        guard maximumCheckpoints > 0 else { throw VisualError.invalidCheckpointLimit }
        self.maximumCheckpoints = maximumCheckpoints
    }

    /// Records a dummy checkpoint. Does not capture, upload, or compare anything.
    ///
    /// Cancellation observed before commit leaves state unchanged.
    /// Cancellation after commit does not undo success. Repeated names are allowed and counted.
    /// - Throws: `CancellationError`, or a documented `VisualError`.
    public func recordCheckpoint(named name: String) throws -> CheckpointReceipt {
        try Task.checkCancellation()
        guard !finished else { throw VisualError.sessionFinished }
        let normalized = try Self.validatedName(name, error: .invalidCheckpointName)
        guard checkpointCount < maximumCheckpoints else {
            throw VisualError.checkpointLimitReached
        }
        // The preceding bound also prevents overflow when the limit is Int.max.
        checkpointCount += 1
        return CheckpointReceipt(
            sessionName: sessionName,
            checkpointName: normalized,
            sequence: checkpointCount
        )
    }

    /// Ends this mock session. Repeated non-cancelled calls return the same value.
    /// A checkpoint racing with finish either commits first or fails as finished.
    /// - Throws: `CancellationError` when the caller is already cancelled.
    public func finish() throws -> SessionSummary {
        try Task.checkCancellation()
        finished = true
        return SessionSummary(sessionName: sessionName, checkpointCount: checkpointCount)
    }

    private nonisolated static func validatedName(
        _ value: String,
        error: VisualError
    ) throws -> String {
        let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty, normalized.utf8.count <= 200 else { throw error }
        return normalized
    }
}
