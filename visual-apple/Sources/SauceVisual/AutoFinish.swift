import Foundation
import XCTest

/// Finishes the build when the tests end, so you never have to call `finish()`.
internal enum AutoFinish {
    enum Outcome: Sendable {
        case noBuild
        case leftOpen(VisualBuild)
        case finished(VisualBuild)
        case failed(Error)
    }

    /// Long enough for a slow network, short enough not to stall the run.
    static let timeout: TimeInterval = 60

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

        /// XCTest exits right after this returns, so wait here for the request to finish.
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
