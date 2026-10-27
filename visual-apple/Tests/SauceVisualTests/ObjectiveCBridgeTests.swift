#if canImport(ObjectiveC)
import Foundation
import XCTest
import SauceVisual

// Test-only: no mutable instance state, XCTest owns its synchronization.
final class ObjectiveCBridgeTests: XCTestCase, @unchecked Sendable {
    func testObjectiveCErrorCodesMatchSwiftErrors() {
        let codes: [VisualErrorCode] = [
            .invalidSessionName, .invalidCheckpointName, .invalidCheckpointLimit,
            .sessionFinished, .checkpointLimitReached, .cancelled
        ]
        for code in codes {
            let error = VisualError(rawValue: code.rawValue)! as NSError
            XCTAssertEqual(error.domain, VisualClient.errorDomain)
            XCTAssertEqual(error.code, code.rawValue)
            XCTAssertEqual(error.userInfo.count, 1)
        }
    }

    func testSuccessFromBackgroundTaskAndDroppedHandle() async throws {
        let client = try VisualClient(sessionName: "Bridge")
        let receipt: VisualCheckpointReceipt = try await withCheckedThrowingContinuation { continuation in
            Task.detached {
                // Deliberately do not retain the returned operation.
                client.recordCheckpoint(named: "Sample") { receipt, error in
                    XCTAssertTrue(Thread.isMainThread)
                    if let receipt {
                        XCTAssertNil(error)
                        continuation.resume(returning: receipt)
                    } else {
                        continuation.resume(throwing: error ?? VisualError.invalidCheckpointName as NSError)
                    }
                }
            }
        }
        XCTAssertEqual(receipt.sequence, 1)
        XCTAssertTrue(receipt.isMock)
    }

    func testCancellationRaceReturnsExactlyOneValidOutcome() async throws {
        let client = try VisualClient(sessionName: "Cancellation")
        let committed: Bool = await withCheckedContinuation { continuation in
            let operation = client.recordCheckpoint(named: "Racing") { receipt, error in
                XCTAssertTrue(Thread.isMainThread)
                if let receipt {
                    XCTAssertNil(error)
                    XCTAssertEqual(receipt.sequence, 1)
                    continuation.resume(returning: true)
                } else {
                    XCTAssertEqual(error?.domain, VisualClient.errorDomain)
                    XCTAssertEqual(error?.code, VisualError.cancelled.rawValue)
                    continuation.resume(returning: false)
                }
            }
            // Commit may win the race; requiring cancellation here would be flaky.
            operation.cancel()
            operation.cancel()
        }
        let count: Int = try await withCheckedThrowingContinuation { continuation in
            client.finish { summary, error in
                if let summary { continuation.resume(returning: summary.checkpointCount) }
                else { continuation.resume(throwing: error ?? VisualError.cancelled as NSError) }
            }
        }
        XCTAssertEqual(count, committed ? 1 : 0)
    }

    func testFinishIsIdempotentThroughClient() async throws {
        let client = try VisualClient(sessionName: "Repeated finish")
        func finish() async throws -> VisualSessionSummary {
            try await withCheckedThrowingContinuation { continuation in
                client.finish { summary, error in
                    XCTAssertTrue(Thread.isMainThread)
                    if let summary {
                        XCTAssertNil(error)
                        continuation.resume(returning: summary)
                    } else {
                        XCTAssertNotNil(error)
                        continuation.resume(throwing: error ?? VisualError.cancelled as NSError)
                    }
                }
            }
        }
        let first = try await finish()
        let second = try await finish()
        XCTAssertEqual(first.sessionName, "Repeated finish")
        XCTAssertEqual(first.sessionName, second.sessionName)
        XCTAssertEqual(first.checkpointCount, 0)
        XCTAssertEqual(first.checkpointCount, second.checkpointCount)
        XCTAssertTrue(first.isMock && second.isMock)
    }

    func testFinishCancellationRacePreservesSessionState() async throws {
        let client = try VisualClient(sessionName: "Finish cancellation")
        let finished: Bool = await withCheckedContinuation { continuation in
            let operation = client.finish { summary, error in
                XCTAssertTrue(Thread.isMainThread)
                if let summary {
                    XCTAssertNil(error)
                    XCTAssertEqual(summary.checkpointCount, 0)
                    continuation.resume(returning: true)
                } else {
                    XCTAssertEqual(error?.domain, VisualClient.errorDomain)
                    XCTAssertEqual(error?.code, VisualError.cancelled.rawValue)
                    continuation.resume(returning: false)
                }
            }
            // Either commit or cancellation may win. Neither may undo a commit.
            operation.cancel()
            operation.cancel()
        }
        let admitted: Bool = await withCheckedContinuation { continuation in
            client.recordCheckpoint(named: "After finish attempt") { receipt, error in
                XCTAssertTrue(Thread.isMainThread)
                if let receipt {
                    XCTAssertNil(error)
                    XCTAssertFalse(finished)
                    XCTAssertEqual(receipt.sequence, 1)
                    continuation.resume(returning: true)
                } else {
                    XCTAssertTrue(finished)
                    XCTAssertEqual(error?.domain, VisualClient.errorDomain)
                    XCTAssertEqual(error?.code, VisualError.sessionFinished.rawValue)
                    continuation.resume(returning: false)
                }
            }
        }
        XCTAssertEqual(admitted, !finished)
        let summary: VisualSessionSummary = try await withCheckedThrowingContinuation { continuation in
            client.finish { summary, error in
                XCTAssertTrue(Thread.isMainThread)
                if let summary {
                    XCTAssertNil(error)
                    continuation.resume(returning: summary)
                } else {
                    continuation.resume(throwing: error ?? VisualError.cancelled as NSError)
                }
            }
        }
        XCTAssertEqual(summary.checkpointCount, admitted ? 1 : 0)
        XCTAssertTrue(summary.isMock)
    }
}
#endif
