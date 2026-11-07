import Foundation

/// Main-actor gate with cancellation-safe handoff. The shared gate serializes capture; the separate
/// submissions gate bounds complete pipelines without holding the UI gate over networking.
@MainActor
internal final class CaptureGate {
    static let shared = CaptureGate()
    /// Bounds SDK-owned rendered images awaiting upload without holding the UI gate over I/O.
    static let submissions = CaptureGate(capacity: 2)
    private let capacity: Int
    private var occupied = 0

    init(capacity: Int = 1) {
        precondition(capacity > 0)
        self.capacity = capacity
    }
    private var waiters: [(id: UUID, continuation: CheckedContinuation<Void, Error>)] = []

    func withCapture<T>(_ operation: @MainActor () async throws -> T) async throws -> T {
        try await acquire()
        defer { release() }
        try Task.checkCancellation()
        return try await operation()
    }

    private func acquire() async throws {
        try Task.checkCancellation()
        if occupied < capacity {
            occupied += 1
            return
        }
        let id = UUID()
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                // The task can be cancelled before the continuation is installed.
                if Task.isCancelled {
                    continuation.resume(throwing: CancellationError())
                } else {
                    waiters.append((id, continuation))
                }
            }
        } onCancel: {
            Task { @MainActor in self.cancelWaiter(id) }
        }
        // Once granted, this task owns the gate even if cancellation races with handoff.
        // withCapture's defer releases it before propagating cancellation.
    }

    private func cancelWaiter(_ id: UUID) {
        guard let index = waiters.firstIndex(where: { $0.id == id }) else { return }
        let waiter = waiters.remove(at: index)
        waiter.continuation.resume(throwing: CancellationError())
    }

    private func release() {
        if waiters.isEmpty {
            occupied -= 1
        } else {
            let next = waiters.removeFirst()
            next.continuation.resume()
        }
    }
}
