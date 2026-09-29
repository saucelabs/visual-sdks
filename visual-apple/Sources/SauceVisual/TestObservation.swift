import Foundation
import XCTest

/// Called by `SauceVisualLoader.c` when the SDK loads.
@_cdecl("SauceVisualRegisterTestObservers")
internal func registerTestObservers() {
    TestObservation.register()
}

internal enum TestObservation {
    private static let registration: Void = {
        // XCTest observers must be added on the main thread, where the test bundle normally loads.
        let add: @Sendable () -> Void = {
            MainActor.assumeIsolated {
                let center = XCTestObservationCenter.shared
                center.addTestObserver(CurrentTest.shared)
                center.addTestObserver(AutoFinish.Observer(store: .shared, timeout: AutoFinish.timeout))
            }
        }
        if Thread.isMainThread { add() } else { DispatchQueue.main.async(execute: add) }
    }()

    /// Adds the observers once. Safe to call from any thread.
    static func register() {
        _ = registration
    }
}

/// Remembers the running test, so snapshots get its names automatically.
/// XCTest runs one test at a time in each process.
internal final class CurrentTest: NSObject, XCTestObservation, @unchecked Sendable {
    static let shared = CurrentTest()

    private let lock = NSLock()
    private var running: TestIdentity?

    /// The running test's names, or none outside a test.
    var identity: TestIdentity {
        lock.lock()
        defer { lock.unlock() }
        return running ?? TestIdentity()
    }

    func testCaseWillStart(_ testCase: XCTestCase) {
        let identity = TestIdentity(testCase)
        lock.lock()
        running = identity
        lock.unlock()
    }

    func testCaseDidFinish(_ testCase: XCTestCase) {
        lock.lock()
        running = nil
        lock.unlock()
    }
}
