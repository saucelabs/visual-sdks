import Foundation
import XCTest

/// Finishes the build this process created when the XCTest bundle ends, as a best-effort fallback, not a CI success guarantee.
/// Builds named by `buildId` or `customId` are left open for whoever coordinates the workers, unless a
/// `finishDelay` is set: then every worker finishes the build, and the service applies a grace period; it does not count workers.
internal enum AutoFinish {
    enum Outcome: Sendable {
        case noBuild
        case leftOpen(VisualBuild)
        case finished(VisualBuild)
        case finishDelayed(VisualBuild, seconds: Int)
        case failed(Error)
    }

    /// Long enough for a slow network, short enough not to stall the run.
    static let timeout: TimeInterval = 60

    static func message(for outcome: Outcome) -> String? {
        switch outcome {
        case .noBuild:
            return nil
        case .leftOpen(let build):
            return "Sauce Visual: left build \(build.url ?? build.id) open, because it is named by a build ID or custom ID. Finish it once every worker is done."
        case .finished(let build):
            return "Sauce Visual: finished build \(build.url ?? build.id) (\(build.status ?? "unknown"))."
        case .finishDelayed(let build, let seconds):
            return "Sauce Visual: build \(build.url ?? build.id) finishes \(seconds) s after the last worker finishes it."
        case .failed:
            return "Sauce Visual: could not confirm finalization. Use the explicit run owner to inspect or reconcile the build."
        }
    }

    final class Observer: NSObject, XCTestObservation, Sendable {
        private let store: SharedBuildStore
        private let timeout: TimeInterval

        init(store: SharedBuildStore, timeout: TimeInterval) {
            self.store = store
            self.timeout = timeout
            super.init()
        }

        /// XCTest exits right after this returns, so wait here for the request to finish.
        /// XCTest calls this on the main thread. Blocking it on a semaphore the lower-priority task signals is a
        /// priority inversion, which the Thread Performance Checker reports, so poll a flag between short sleeps.
        func testBundleDidFinish(_ testBundle: Bundle) {
            let store = self.store
            let done = Flag()
            Task.detached {
                if let message = AutoFinish.message(for: await store.finishOwnedBuild()) { print(message) }
                done.set()
            }
            let deadline = Date(timeIntervalSinceNow: timeout)
            while !done.isSet {
                if Date() >= deadline {
                    return print("Sauce Visual: timed out after \(Int(timeout)) s while finishing the build.")
                }
                Thread.sleep(forTimeInterval: 0.05)
            }
        }
    }

    final class Flag: @unchecked Sendable {
        private let lock = NSLock()
        private var value = false

        var isSet: Bool {
            lock.lock()
            defer { lock.unlock() }
            return value
        }

        func set() {
            lock.lock()
            value = true
            lock.unlock()
        }
    }
}
