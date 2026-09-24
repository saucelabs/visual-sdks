import Foundation
import XCTest
import SauceVisual

// No mutable instance state. XCTest owns its internal synchronization.
// This conformance is test-only, to permit async discovery on newer Swift toolchains.
final class VisualSessionTests: XCTestCase, @unchecked Sendable {
    func testConstructorTrimsSessionName() throws {
        let session = try VisualSession(sessionName: "  Checkout\n")
        XCTAssertEqual(session.sessionName, "Checkout")
        XCTAssertEqual(session.maximumCheckpoints, 10_000)
    }

    func testInvalidSessionNames() {
        for name in ["", " \n\t", String(repeating: "a", count: 201)] {
            XCTAssertThrowsError(try VisualSession(sessionName: name)) {
                XCTAssertEqual($0 as? VisualError, .invalidSessionName)
            }
        }
    }

    func testInvalidLimits() {
        for limit in [0, -1, Int.min] {
            XCTAssertThrowsError(try VisualSession(sessionName: "Example", maximumCheckpoints: limit)) {
                XCTAssertEqual($0 as? VisualError, .invalidCheckpointLimit)
            }
        }
    }

    func testUTF8Boundary() throws {
        XCTAssertNoThrow(try VisualSession(sessionName: String(repeating: "😀", count: 50)))
        XCTAssertThrowsError(try VisualSession(sessionName: String(repeating: "😀", count: 51))) {
            XCTAssertEqual($0 as? VisualError, .invalidSessionName)
        }
    }

    func testCheckpointAndSummary() async throws {
        let session = try VisualSession(sessionName: "Checkout")
        let first = try await session.recordCheckpoint(named: "  Cart\n")
        let second = try await session.recordCheckpoint(named: "Cart")
        XCTAssertEqual(first.sessionName, "Checkout")
        XCTAssertEqual(first.checkpointName, "Cart")
        XCTAssertEqual(first.sequence, 1)
        XCTAssertEqual(second.sequence, 2)
        XCTAssertTrue(first.isMock)
        let summary = try await session.finish()
        XCTAssertEqual(summary.sessionName, "Checkout")
        XCTAssertEqual(summary.checkpointCount, 2)
        XCTAssertTrue(summary.isMock)
    }

    func testInvalidCheckpointDoesNotConsumeSequence() async throws {
        let session = try VisualSession(sessionName: "Example")
        for name in ["", "  \n", String(repeating: "😀", count: 51)] {
            do {
                _ = try await session.recordCheckpoint(named: name)
                XCTFail("Invalid name unexpectedly succeeded")
            } catch {
                XCTAssertEqual(error as? VisualError, .invalidCheckpointName)
            }
        }
        let receipt = try await session.recordCheckpoint(named: String(repeating: "a", count: 200))
        XCTAssertEqual(receipt.sequence, 1)
    }

    func testLimitIsEnforcedWithoutMutation() async throws {
        let session = try VisualSession(sessionName: "Example", maximumCheckpoints: 1)
        _ = try await session.recordCheckpoint(named: "First")
        do {
            _ = try await session.recordCheckpoint(named: "Second")
            XCTFail("Limit was not enforced")
        } catch {
            XCTAssertEqual(error as? VisualError, .checkpointLimitReached)
        }
        let summary = try await session.finish()
        XCTAssertEqual(summary.checkpointCount, 1)
    }

    func testIntMaxLimitCanRecord() async throws {
        let session = try VisualSession(sessionName: "Example", maximumCheckpoints: Int.max)
        let receipt = try await session.recordCheckpoint(named: "First")
        XCTAssertEqual(receipt.sequence, 1)
    }

    func testFinishIsIdempotentAndTerminal() async throws {
        let session = try VisualSession(sessionName: "Example")
        let first = try await session.finish()
        let second = try await session.finish()
        XCTAssertEqual(first, second)
        XCTAssertEqual(first.checkpointCount, 0)
        do {
            _ = try await session.recordCheckpoint(named: "Too late")
            XCTFail("Finished session accepted a checkpoint")
        } catch {
            XCTAssertEqual(error as? VisualError, .sessionFinished)
        }
    }

    func testConcurrentCheckpointsHaveUniqueContiguousSequences() async throws {
        let session = try VisualSession(sessionName: "Concurrency", maximumCheckpoints: 200)
        let sequences = try await withThrowingTaskGroup(of: Int.self) { group in
            for index in 0..<200 {
                group.addTask {
                    try await session.recordCheckpoint(named: "Checkpoint \(index)").sequence
                }
            }
            var collected = [Int]()
            for try await sequence in group { collected.append(sequence) }
            return collected.sorted()
        }
        XCTAssertEqual(sequences, Array(1...200))
        let summary = try await session.finish()
        XCTAssertEqual(summary.checkpointCount, 200)
    }

    func testSessionsAreIndependent() async throws {
        let a = try VisualSession(sessionName: "Same name")
        let b = try VisualSession(sessionName: "Same name")
        _ = try await a.recordCheckpoint(named: "A")
        let summaryA = try await a.finish()
        let summaryB = try await b.finish()
        XCTAssertEqual(summaryA.checkpointCount, 1)
        XCTAssertEqual(summaryB.checkpointCount, 0)
    }

    func testCancelledCheckpointDoesNotMutate() async throws {
        let session = try VisualSession(sessionName: "Cancellation")
        let task = Task {
            // Cancel the current task before entering the actor. No timing race.
            withUnsafeCurrentTask { $0?.cancel() }
            return try await session.recordCheckpoint(named: "Cancelled")
        }
        do {
            _ = try await task.value
            XCTFail("Cancelled checkpoint unexpectedly succeeded")
        } catch {
            XCTAssertTrue(error is CancellationError)
        }
        let next = try await session.recordCheckpoint(named: "Valid")
        XCTAssertEqual(next.sequence, 1)
    }

    func testCancelledFinishLeavesSessionOpen() async throws {
        let session = try VisualSession(sessionName: "Cancellation")
        let task = Task {
            withUnsafeCurrentTask { $0?.cancel() }
            return try await session.finish()
        }
        do {
            _ = try await task.value
            XCTFail("Cancelled finish unexpectedly succeeded")
        } catch {
            XCTAssertTrue(error is CancellationError)
        }
        let receipt = try await session.recordCheckpoint(named: "Still open")
        XCTAssertEqual(receipt.sequence, 1)
    }

    func testFinishRacingWithRecordsHasConsistentCount() async throws {
        let session = try VisualSession(sessionName: "Race")
        let successes = try await withThrowingTaskGroup(of: Bool.self) { group in
            group.addTask {
                _ = try await session.finish()
                return false
            }
            for index in 0..<100 {
                group.addTask {
                    do {
                        _ = try await session.recordCheckpoint(named: "\(index)")
                        return true
                    } catch VisualError.sessionFinished {
                        return false
                    }
                }
            }
            var count = 0
            for try await success in group { if success { count += 1 } }
            return count
        }
        let summary = try await session.finish()
        XCTAssertEqual(summary.checkpointCount, successes)
    }

    func testStateAndValidationErrorPrecedence() async throws {
        let session = try VisualSession(sessionName: "Precedence", maximumCheckpoints: 1)
        _ = try await session.recordCheckpoint(named: "First")
        do {
            _ = try await session.recordCheckpoint(named: " ")
            XCTFail("Invalid checkpoint unexpectedly succeeded")
        } catch {
            // Validation precedes the capacity check while the session is open.
            XCTAssertEqual(error as? VisualError, .invalidCheckpointName)
        }
        _ = try await session.finish()
        do {
            _ = try await session.recordCheckpoint(named: " ")
            XCTFail("Finished session unexpectedly accepted a checkpoint")
        } catch {
            // Terminal state precedes name validation.
            XCTAssertEqual(error as? VisualError, .sessionFinished)
        }
    }

    func testCancelledRepeatedFinishStillThrows() async throws {
        let session = try VisualSession(sessionName: "Finished cancellation")
        let original = try await session.finish()
        let task = Task {
            withUnsafeCurrentTask { $0?.cancel() }
            return try await session.finish()
        }
        do {
            _ = try await task.value
            XCTFail("Cancelled repeated finish unexpectedly succeeded")
        } catch {
            XCTAssertTrue(error is CancellationError)
        }
        let final = try await session.finish()
        XCTAssertEqual(original, final)
    }

    func testConcurrentCapacityCannotBeExceeded() async throws {
        let session = try VisualSession(sessionName: "Capacity", maximumCheckpoints: 7)
        let sequences = try await withThrowingTaskGroup(of: Int?.self) { group in
            for index in 0..<50 {
                group.addTask {
                    do {
                        return try await session.recordCheckpoint(named: "\(index)").sequence
                    } catch VisualError.checkpointLimitReached {
                        return nil
                    }
                }
            }
            var values = [Int]()
            for try await value in group {
                if let value { values.append(value) }
            }
            return values.sorted()
        }
        XCTAssertEqual(sequences, Array(1...7))
        let summary = try await session.finish()
        XCTAssertEqual(summary.checkpointCount, 7)
    }

    func testNSErrorContract() {
        let cases: [VisualError] = [
            .invalidSessionName, .invalidCheckpointName, .invalidCheckpointLimit,
            .sessionFinished, .checkpointLimitReached, .cancelled
        ]
        for (index, error) in cases.enumerated() {
            let nsError = error as NSError
            XCTAssertEqual(nsError.domain, "com.saucelabs.visual.apple")
            XCTAssertEqual(nsError.code, index + 1)
            XCTAssertFalse(nsError.localizedDescription.isEmpty)
            XCTAssertEqual(nsError.userInfo.count, 1)
        }
    }

    func testConcurrentFinishCallsReturnIdenticalSummaries() async throws {
        let session = try VisualSession(sessionName: "Finishing")
        _ = try await session.recordCheckpoint(named: "One")
        let summaries = try await withThrowingTaskGroup(of: SessionSummary.self) { group in
            for _ in 0..<30 {
                group.addTask { try await session.finish() }
            }
            var values = [SessionSummary]()
            for try await summary in group { values.append(summary) }
            return values
        }
        XCTAssertEqual(summaries.count, 30)
        for summary in summaries {
            XCTAssertEqual(summary.sessionName, "Finishing")
            XCTAssertEqual(summary.checkpointCount, 1)
            XCTAssertTrue(summary.isMock)
        }
    }

    func testCancellationPrecedesFinishedStateAndNameValidation() async throws {
        let session = try VisualSession(sessionName: "Precedence")
        _ = try await session.finish()
        let task = Task {
            withUnsafeCurrentTask { $0?.cancel() }
            return try await session.recordCheckpoint(named: " ")
        }
        do {
            _ = try await task.value
            XCTFail("A pre-cancelled task unexpectedly succeeded")
        } catch {
            XCTAssertTrue(error is CancellationError)
        }
    }

}
