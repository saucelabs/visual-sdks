#if canImport(ObjectiveC)
import Foundation

/// Objective-C facade over the same actor used by Swift clients.
///
/// Entry points may be called from any thread. Completion is invoked once on MainActor, never inline, with either a result or an NSError, never both.
/// A callback may race with a background caller's return: it never executes on that caller's stack.
/// Swift async callers should use `VisualSession`.
/// Every operation retains what it needs until completion, independently of the client and handle lifetimes. There is no shared singleton or mutable bridge.
@objc(SLVClient)
public final class VisualClient: NSObject, Sendable {
    private let session: VisualSession
    /// NSError domain used by this SDK.
    @objc public static var errorDomain: String { VisualError.errorDomain }
    /// Always true: this client never connects to Sauce Visual.
    @objc public var isMock: Bool { true }

    /// Creates a mock client. Names are trimmed and limited to 200 UTF-8 bytes.
    /// - Throws: `VisualError.invalidSessionName` or `.invalidCheckpointLimit`.
    @objc(initWithSessionName:maximumCheckpoints:error:)
    public init(sessionName: String, maximumCheckpoints: Int = 10_000) throws {
        session = try VisualSession(
            sessionName: sessionName,
            maximumCheckpoints: maximumCheckpoints
        )
        super.init()
    }

    /// Records an in-memory checkpoint and returns a cooperative cancellation handle.
    /// Completion receives a receipt or an NSError, exactly once on MainActor.
    @objc(recordCheckpointWithName:completion:)
    @discardableResult
    public func recordCheckpoint(
        named name: String,
        completion: @escaping @MainActor @Sendable (VisualCheckpointReceipt?, NSError?) -> Void
    ) -> VisualOperation {
        let session = self.session
        let task = Task {
            do {
                let receipt = try await session.recordCheckpoint(named: name)
                // Do not recheck cancellation: the operation already committed.
                await completion(VisualCheckpointReceipt(receipt), nil)
            } catch {
                await completion(nil, Self.bridge(error))
            }
        }
        return VisualOperation(task: task)
    }

    /// Finishes the mock session. Repeated non-cancelled calls return the same values.
    /// Completion receives a summary or an NSError, exactly once on MainActor.
    @objc(finishWithCompletion:)
    @discardableResult
    public func finish(
        completion: @escaping @MainActor @Sendable (VisualSessionSummary?, NSError?) -> Void
    ) -> VisualOperation {
        let session = self.session
        let task = Task {
            do {
                let summary = try await session.finish()
                await completion(VisualSessionSummary(summary), nil)
            } catch {
                await completion(nil, Self.bridge(error))
            }
        }
        return VisualOperation(task: task)
    }

    private static func bridge(_ error: Error) -> NSError {
        if error is CancellationError { return VisualError.cancelled as NSError }
        return error as NSError
    }
}
#endif
