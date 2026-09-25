import Foundation
import XCTest

/// Finishes the build this process created when the XCTest bundle ends, so tests never call `finish()`.
internal enum AutoFinish {
    enum Outcome: Sendable {
        case noBuild
        case leftOpen(VisualBuild)
        case finished(VisualBuild)
        case failed(Error)
    }

    /// Long enough for a slow network, short enough not to stall the run.
    static let timeout: TimeInterval = 60

    private static let registration: Void = {
        // XCTestObservationCenter must be used on the main thread.
        DispatchQueue.main.async {
            MainActor.assumeIsolated {
                XCTestObservationCenter.shared.addTestObserver(Observer(store: .shared, timeout: timeout))
            }
        }
    }()

    /// Registers the observer once per process. Safe to call from any thread.
    static func register() {
        _ = registration
    }

    static func message(for outcome: Outcome) -> String? {
        switch outcome {
        case .noBuild:
            return nil
        case .leftOpen(let build):
            return "Sauce Visual: left build \(build.url ?? build.id) open, because this run did not create it."
        case .finished(let build):
            return "Sauce Visual: finished build \(build.url ?? build.id) (\(build.status ?? "unknown"))."
        case .failed(let error):
            return "Sauce Visual: could not finish the build. \(error)"
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

        /// XCTest exits after this returns, so wait here for the network call.
        func testBundleDidFinish(_ testBundle: Bundle) {
            let store = self.store
            let done = DispatchSemaphore(value: 0)
            Task.detached {
                if let message = AutoFinish.message(for: await store.finishCreatedBuild()) { print(message) }
                done.signal()
            }
            if done.wait(timeout: .now() + timeout) == .timedOut {
                print("Sauce Visual: timed out after \(Int(timeout)) s while finishing the build.")
            }
        }
    }
}
