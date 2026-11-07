import CoreGraphics
import Foundation
import XCTest
@testable import SauceVisual

final class ContributionCaptureTests: XCTestCase, @unchecked Sendable {
    func testZeroMotionParticipatesDespiteAChangedRow() {
        let original = (0..<200).map(UInt64.init)
        var changed = original
        changed[199] = 99_999
        XCTAssertEqual(ScrollAlignment.offset(from: original, to: changed, expected: 100)?.rows, 0)
    }

    func testRepeatedContentDoesNotInventMovement() {
        let original = (0..<200).map { UInt64($0 % 50) }
        var stationary = original
        stationary[199] = 99_999
        XCTAssertNil(ScrollAlignment.offset(from: original, to: stationary, expected: 100))
        let moved = Array(original.dropFirst(50)) + (0..<50).map { UInt64(10_000 + $0) }
        XCTAssertNil(ScrollAlignment.offset(from: original, to: moved, expected: 100))
    }

    func testImageBudgetsRejectOverflowBeforeAllocation() {
        XCTAssertThrowsError(try CaptureLimits.dimensions(width: Int.max, height: 4, maximumPixels: 1_000))
        XCTAssertThrowsError(try CaptureLimits.adding(Int.max, 1))
        XCTAssertThrowsError(try CaptureLimits.dimensions(width: 40, height: 40, maximumPixels: 1_000))
        XCTAssertNoThrow(try CaptureLimits.dimensions(width: 40, height: 20, maximumPixels: 1_000))
    }

    func testFullPageLimitsAreFiniteAndBounded() {
        XCTAssertThrowsError(try FullPageScreenshot.validate(scrollLimit: 101, delayAfterScroll: 0))
        XCTAssertThrowsError(try FullPageScreenshot.validate(scrollLimit: 2, delayAfterScroll: 1,
                                                            maximumOutputPixels: 32_000_001))
        XCTAssertThrowsError(try FullPageScreenshot.validate(scrollLimit: 2, delayAfterScroll: 0,
                                                            maximumDuration: .infinity))
        XCTAssertThrowsError(try FullPageScreenshot.validate(scrollLimit: 2, delayAfterScroll: 2,
                                                            maximumDuration: 1))
    }

    func testDomOriginDoesNotSilentlyLoseFractionalCropOffset() {
        XCTAssertNoThrow(try DomCapture.validateOrigin(CGPoint(x: 1, y: 2)))
        XCTAssertThrowsError(try DomCapture.validateOrigin(CGPoint(x: 1.0 / 3.0, y: 0)))
        XCTAssertThrowsError(try DomCapture.validateOrigin(CGPoint(x: CGFloat.nan, y: 0)))
    }

    func testExplicitSemanticOptionsRequireDom() {
        XCTAssertThrowsError(try VisualCheckOptions(diffingOptions: [.content]).validate())
        XCTAssertThrowsError(try VisualCheckOptions(regions: [.detectChanges(in: CGRect(x: 0, y: 0, width: 10, height: 10), [.style])]).validate())
        XCTAssertNoThrow(try VisualCheckOptions(diffingOptions: [.content], captureDom: true).validate())
        XCTAssertThrowsError(try SnapshotRequest(diffingOptions: [.content]).validate())
    }

    func testUnknownDiffingBitsAreRejected() {
        XCTAssertThrowsError(try VisualCheckOptions(diffingOptions: DiffingOptions(rawValue: 1 << 20)).validate())
        XCTAssertThrowsError(try SnapshotRequest(diffingOptions: DiffingOptions(rawValue: 1 << 20)).validate())
    }

    func testResolvedFullPageCannotCarryUnprojectedMetadata() {
        let clip = CGRect(x: 0, y: 0, width: 100, height: 100)
        let dom = DomSnapshot(xml: Data("<AppiumAUT/>".utf8), devicePixelRatio: 1)
        XCTAssertThrowsError(try SnapshotRequest(clip: clip, dom: dom, fullPage: []).validate())
        let mask = PixelRegion(CGRect(x: 0, y: 0, width: 10, height: 10), scale: 1,
                               in: clip, name: nil, diffingOptions: nil)!
        XCTAssertThrowsError(try SnapshotRequest(clip: clip, regions: [mask], fullPage: []).validate())
    }

    @MainActor
    func testQueuedCaptureCancelsBeforeTheCurrentCaptureFinishes() async throws {
        let gate = CaptureGate()
        let releaseHolder = CaptureLatch()
        let holderEntered = expectation(description: "First capture owns the gate")
        let waiterStarted = expectation(description: "Second capture requests the gate")
        let waiterFinished = expectation(description: "Queued cancellation completes without releasing the owner")
        let holder = Task { @MainActor in
            try await gate.withCapture {
                holderEntered.fulfill()
                await releaseHolder.wait()
            }
        }
        defer { releaseHolder.open(); holder.cancel() }
        await fulfillment(of: [holderEntered], timeout: 5)
        let queued = Task { @MainActor in
            waiterStarted.fulfill()
            do {
                try await gate.withCapture { XCTFail("A cancelled queued capture must never run") }
                XCTFail("Expected cancellation")
            } catch { XCTAssertTrue(error is CancellationError) }
            waiterFinished.fulfill()
        }
        defer { queued.cancel() }
        await fulfillment(of: [waiterStarted], timeout: 5)
        queued.cancel()
        await fulfillment(of: [waiterFinished], timeout: 5)
        releaseHolder.open()
        try await holder.value
        await queued.value
        let next = try await gate.withCapture { 42 }
        XCTAssertEqual(next, 42, "Cancellation must not consume or leak a capture slot")
    }

    @MainActor
    func testGateReleasesAfterThrowingAndCancellation() async throws {
        let gate = CaptureGate()
        do {
            _ = try await gate.withCapture { () -> Int in throw VisualError.screenshotFailed }
            XCTFail("Expected failure")
        } catch { XCTAssertEqual(error as? VisualError, .screenshotFailed) }
        let cancelled = Task { @MainActor in
            withUnsafeCurrentTask { $0?.cancel() }
            return try await gate.withCapture { 1 }
        }
        do {
            _ = try await cancelled.value
            XCTFail("Expected cancellation before acquiring the gate")
        } catch {
            XCTAssertTrue(error is CancellationError)
        }
        let result = try await gate.withCapture { 2 }
        XCTAssertEqual(result, 2)
    }
}

@MainActor
private final class CaptureLatch {
    private var isOpen = false
    private var continuation: CheckedContinuation<Void, Never>?

    func wait() async {
        guard !isOpen else { return }
        await withCheckedContinuation { continuation = $0 }
    }

    func open() {
        isOpen = true
        continuation?.resume()
        continuation = nil
    }
}
