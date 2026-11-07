import Foundation
import XCTest
import SauceVisual

/// Public-API checks compiled independently through source SPM and the XCFramework on every platform.
final class ContributionConsumerTests: XCTestCase, @unchecked Sendable {
    func testReceiptDistinguishesSubmissionFromCaptureExtent() {
        let receipt = VisualSnapshot(id: "snapshot", name: "Prefix", buildId: "build",
                                     captureExtent: .limitReached, hasDom: false,
                                     pixelWidth: 300, pixelHeight: 900)
        XCTAssertEqual(receipt.captureExtent, .limitReached)
        XCTAssertFalse(receipt.hasDom)
        XCTAssertEqual(receipt.pixelWidth, 300)
        XCTAssertEqual(receipt.pixelHeight, 900)
        XCTAssertNotNil(NSClassFromString("SLVOperation"))
        XCTAssertNotNil(NSClassFromString("SLVClient"))
    }

    @MainActor
    func testUnsupportedCombinationsFailBeforeCaptureOrNetworking() async throws {
        // Syntactically valid fake credentials; these cases must fail without reaching the network.
        // A client does not bind the process run until an operation is admitted.
        let client = try VisualClient(credentials: VisualCredentials(username: "test", accessKey: "not-real"))
        do {
            _ = try await client.sauceVisualCheck("Semantic without tree", options: VisualCheckOptions(diffingOptions: [.content]))
            XCTFail("Expected an explicit unsupported-combination error")
        } catch {
            XCTAssertEqual(error as? VisualError, .unsupportedCaptureCombination)
        }
    }

    func testNewStableNSErrorCodes() {
        XCTAssertEqual((VisualError.captureAlignmentFailed as NSError).domain, "com.saucelabs.visual.apple")
        XCTAssertEqual((VisualError.captureAlignmentFailed as NSError).code, 17)
        XCTAssertEqual((VisualError.unsupportedCaptureCombination as NSError).code, 22)
    }
}

extension ContributionConsumerTests {
    @MainActor
    func testRequestedDOMIsReportedByTheService() async throws {
        let app = XCUIApplication()
        app.launch()
        defer { app.terminate() }
        guard app.staticTexts["SauceVisual SDK integration host"].waitForExistence(timeout: 15) else {
            throw ReadbackFailure.fixtureUnavailable
        }
        let visual = try VisualClient(options: liveBuildOptions, session: liveAPISession)
        #if os(macOS)
        let checkOptions = VisualCheckOptions(clipElement: app.windows.firstMatch, captureDom: true)
        #else
        let checkOptions = VisualCheckOptions(captureDom: true)
        #endif
        let receipt = try await visual.sauceVisualCheck("DOM consumer contract", options: checkOptions)
        XCTAssertTrue(receipt.hasDom)
        XCTAssertEqual(receipt.captureExtent, .viewport)
        let stored = try await Self.readDOMSnapshot(receipt.id, endpoint: visual.region.graphqlEndpoint)
        XCTAssertEqual(stored.name, receipt.name)
        XCTAssertTrue(stored.hasDom)
        XCTAssertGreaterThan(try XCTUnwrap(stored.devicePixelRatio), 0)
        // This confirms service-side artifact attachment, not semantic baseline equality.
    }

    private enum ReadbackFailure: Error {
        case fixtureUnavailable, httpFailure(Int), graphqlFailure, invalidResponse, timedOut
    }
    private struct ReadbackQuery: Encodable {
        let query = "query AppleDOMContract($snapshotId: UUID!) { snapshot(id: $snapshotId) { name hasDom devicePixelRatio } }"
        let variables: Variables
        struct Variables: Encodable { let snapshotId: String }
    }
    private struct StoredSnapshot: Decodable, Sendable {
        let name: String
        let hasDom: Bool
        let devicePixelRatio: Double?
    }
    private struct ReadbackEnvelope: Decodable {
        struct Payload: Decodable { let snapshot: StoredSnapshot? }
        struct OperationError: Decodable {}
        let data: Payload?
        let errors: [OperationError]?
    }

    private static func readDOMSnapshot(_ id: String, endpoint: URL) async throws -> StoredSnapshot {
        // This read-only query uses the same documented fields as the repository's Java integration
        // CheckSnapshotOperation at base 51e62e8b935a44b0a108aff56205fa4b2e160677.
        let credentials = try VisualCredentials.fromEnvironment()
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 10
        configuration.timeoutIntervalForResource = 15
        configuration.httpCookieStorage = nil
        configuration.urlCredentialStorage = nil
        let session = URLSession(configuration: configuration)
        defer { session.invalidateAndCancel() }
        let deadline = DispatchTime.now().uptimeNanoseconds + 30_000_000_000
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let authorization = Data("\(credentials.username):\(credentials.accessKey)".utf8).base64EncodedString()
        request.setValue("Basic " + authorization, forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(ReadbackQuery(variables: .init(snapshotId: id)))
        while DispatchTime.now().uptimeNanoseconds < deadline {
            try Task.checkCancellation()
            let (data, response) = try await session.data(for: request)
            guard let status = (response as? HTTPURLResponse)?.statusCode else { throw ReadbackFailure.invalidResponse }
            guard (200..<300).contains(status) else { throw ReadbackFailure.httpFailure(status) }
            let envelope: ReadbackEnvelope
            do { envelope = try JSONDecoder().decode(ReadbackEnvelope.self, from: data) }
            catch { throw ReadbackFailure.invalidResponse }
            guard envelope.errors?.isEmpty != false else { throw ReadbackFailure.graphqlFailure }
            guard let payload = envelope.data else { throw ReadbackFailure.invalidResponse }
            if let snapshot = payload.snapshot, snapshot.hasDom { return snapshot }
            try await Task.sleep(nanoseconds: 1_000_000_000)
        }
        throw ReadbackFailure.timedOut
    }
}
