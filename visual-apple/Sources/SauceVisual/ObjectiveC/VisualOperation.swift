#if canImport(ObjectiveC)
import Foundation

/// An immutable cancellation handle. Safe to call from any thread.
/// Releasing a handle does not cancel its operation. Cancellation is cooperative.
@objc(SLVOperation)
public final class VisualOperation: NSObject, Sendable {
    private let task: Task<Void, Never>

    internal init(task: Task<Void, Never>) {
        self.task = task
        super.init()
    }

    /// Requests cancellation. Repeated calls are safe; committed work is not undone.
    @objc public func cancel() {
        task.cancel()
    }
}
#endif
