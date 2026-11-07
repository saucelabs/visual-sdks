#if canImport(ObjectiveC)
import Foundation

/// Cancellation requests stop this caller's remaining work. They do not undo committed remote work.
/// Releasing the handle does not cancel the operation.
@objc(SLVOperation)
public final class VisualOperation: NSObject, Sendable {
    private let task: Task<Void, Never>

    internal init(_ task: Task<Void, Never>) {
        self.task = task
        super.init()
    }

    @objc public func cancel() { task.cancel() }
}
#endif
