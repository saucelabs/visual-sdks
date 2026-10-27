import Foundation
import XCTest
// Release runs need `-Xswiftc -enable-testing` for this import.
@testable import SauceVisual

// `@unchecked Sendable` is safe: the tests keep no shared state.
final class SnapshotTests: XCTestCase, @unchecked Sendable {
    private let buildID = "0f8fad5b-d9cb-469f-a165-70867728950e"
    private let uploadID = "7c9e6679-7425-40de-944b-e07fc1f90ae7"
    private let snapshotID = "16fd2706-8baf-433b-82eb-8c7fada847da"
    private let uploadURL = URL(string: "https://storage.test/upload?signature=abc")!
    private let png = Data("hello".utf8)
    private let environment = [
        "SAUCE_USERNAME": "user", "SAUCE_ACCESS_KEY": "super-secret", "SAUCE_REGION": "staging",
        "SIMULATOR_DEVICE_NAME": "iPhone 15 Pro"
    ]

    private var created: StubURLProtocol.Reply {
        .json(["data": ["result": ["id": buildID, "name": "Build", "status": "RUNNING", "url": "http://build"]]])
    }

    private var finished: StubURLProtocol.Reply {
        .json(["data": ["result": ["id": buildID, "name": "Build", "status": "EQUAL", "url": "http://build"]]])
    }

    private func upload(url: String? = nil) -> StubURLProtocol.Reply {
        .json(["data": ["result": ["id": uploadID, "imageUploadUrl": url ?? uploadURL.absoluteString]]])
    }

    private var stored: StubURLProtocol.Reply { StubURLProtocol.Reply(body: Data()) }

    private var snapshot: StubURLProtocol.Reply {
        .json(["data": ["result": ["id": snapshotID]]])
    }

    private func client(
        _ route: StubURLProtocol.Route,
        store: SharedBuildStore = SharedBuildStore(),
        options: VisualBuildOptions = VisualBuildOptions(name: "Build")
    ) throws -> VisualClient {
        try VisualClient(
            credentials: nil, region: nil, options: options,
            session: StubURLProtocol.session(route), environment: environment, store: store,
            uploader: PresignedUploader(configuration: StubURLProtocol.configuration(route))
        )
    }

    private func input(_ body: [String: Any]) -> [String: Any]? {
        (body["variables"] as? [String: Any])?["input"] as? [String: Any]
    }

    func testSnapshotsGoThroughTheBuildOwnersConnection() async throws {
        let store = SharedBuildStore()
        let owner = StubURLProtocol.Route([created, upload(), stored, snapshot])
        let other = StubURLProtocol.Route([])
        _ = try await client(owner, store: store).build()

        // Same configuration on another URLSession: the snapshot still uses the owner's connection.
        let result = try await client(other, store: store).check(name: "Login", png: png)

        XCTAssertEqual(result.buildId, buildID)
        XCTAssertEqual(owner.requests.count, 4)
        XCTAssertEqual(other.requests.count, 0)
    }

    // MARK: - Presigned uploads

    func testUploadsDoNotUseTheAPISession() async throws {
        let api = StubURLProtocol.Route([created, upload(), snapshot])
        let storage = StubURLProtocol.Route([stored])
        let apiSession = URLSession(configuration: StubURLProtocol.configuration(
            api, headers: ["Authorization": "Bearer customer-token", "X-Proxy-Auth": "secret"]
        ))
        let visual = try VisualClient(
            credentials: nil, region: nil, options: VisualBuildOptions(name: "Build"), session: apiSession,
            environment: environment, store: SharedBuildStore(),
            uploader: PresignedUploader(configuration: StubURLProtocol.configuration(storage))
        )
        _ = try await visual.check(name: "Login", png: png)

        XCTAssertEqual(api.requests.first?.value(forHTTPHeaderField: "X-Proxy-Auth"), "secret", "The API session's headers apply to API calls")
        // What the storage service receives:
        let put = try XCTUnwrap(storage.requests.first)
        XCTAssertEqual(storage.requests.count, 1)
        XCTAssertEqual(put.url, uploadURL)
        XCTAssertNil(put.value(forHTTPHeaderField: "Authorization"))
        XCTAssertNil(put.value(forHTTPHeaderField: "X-Proxy-Auth"))
        XCTAssertNil(put.value(forHTTPHeaderField: "Cookie"))
        XCTAssertEqual(put.value(forHTTPHeaderField: "Content-Type"), "image/png")
        XCTAssertNotNil(put.value(forHTTPHeaderField: "Content-MD5"))
    }

    func testInvalidUploadURLsAreRejectedBeforeUploading() async throws {
        let invalid = [
            "http://storage.test/upload", "ftp://storage.test/upload", "/upload", "storage.test/upload",
            "https://user:pass@storage.test/upload", "https://user@storage.test/upload", "https:///upload", "not a url"
        ]
        for url in invalid {
            let route = StubURLProtocol.Route([created, upload(url: url)])
            await XCTAssertThrowsErrorAsync(try await client(route).check(name: "Login", png: png)) {
                XCTAssertEqual(($0 as? VisualAPIError)?.detail, "The API returned an invalid screenshot upload URL.", url)
            }
            XCTAssertEqual(route.requests.count, 2, "\(url): nothing uploaded")
        }
    }

    func testUploadURLRules() throws {
        for url in ["https://storage.test/upload?signature=abc", "HTTPS://storage.test/upload",
                    "http://localhost:4443/upload", "http://127.0.0.1/upload", "http://[::1]:9000/upload"] {
            XCTAssertNoThrow(try PresignedUploader.validated(url, kind: .screenshot), url)
        }
        XCTAssertThrowsError(try PresignedUploader.validated(nil, kind: .screenshot))
        XCTAssertThrowsError(try PresignedUploader.validated("http://localhost.storage.test/upload", kind: .screenshot))
    }

    func testUploadsTimeOutLikeTheJSSDK() async throws {
        let configuration = PresignedUploader(configuration: .ephemeral).session.configuration
        XCTAssertEqual(configuration.timeoutIntervalForRequest, 10)
        XCTAssertEqual(configuration.timeoutIntervalForResource, 10, "The whole upload, not just idle time")

        let route = StubURLProtocol.Route([created, upload(), .failure(.timedOut)])
        await XCTAssertThrowsErrorAsync(try await client(route).check(name: "Login", png: png)) {
            let error = $0 as? VisualAPIError
            XCTAssertEqual(error?.code, .networkFailure)
            XCTAssertEqual(error?.detail, "Screenshot upload failed. The request timed out.")
        }
    }

    func testUploadRedirectsAreNotFollowed() async throws {
        let elsewhere = URL(string: "https://elsewhere.test/collect")!
        let route = StubURLProtocol.Route([created, upload(), .redirect(to: elsewhere), stored, snapshot])
        await XCTAssertThrowsErrorAsync(try await client(route).check(name: "Login", png: png)) {
            XCTAssertEqual(($0 as? VisualAPIError)?.statusCode, 307)
        }
        XCTAssertEqual(route.requests.count, 3, "The redirect target never receives the file")
        XCTAssertFalse(route.requests.contains { $0.url == elsewhere })
    }

    // MARK: - Finishing waits for admitted checks

    private func waitUntilClosed(_ store: SharedBuildStore) async {
        while await !store.isClosed { await Task.yield() }
    }

    private func queries(_ route: StubURLProtocol.Route) -> [String] {
        route.bodies.map { $0["query"] as? String ?? "" }
    }

    func testFinishWaitsForAnUploadInFlight() async throws {
        let store = SharedBuildStore()
        let gate = StubURLProtocol.Gate()
        let route = StubURLProtocol.Route([created, upload(), stored.held(by: gate), snapshot, finished])
        let visual = try client(route, store: store)

        let check = Task { try await visual.check(name: "Login", png: png) }
        await gate.waitForRequest() // The screenshot PUT is in flight.
        let finish = Task { try await visual.finish() }
        await waitUntilClosed(store)

        await XCTAssertThrowsErrorAsync(try await visual.check(name: "Too late", png: png)) {
            XCTAssertEqual($0 as? VisualError, .buildAlreadyCompleted, "No check is admitted once finishing starts")
        }
        try await Task.sleep(nanoseconds: 100_000_000)
        XCTAssertEqual(route.requests.count, 3, "finishBuild waits for the admitted check")

        gate.open()
        let result = try await check.value
        let finishedBuild = try await finish.value
        XCTAssertEqual(result.id, snapshotID)
        XCTAssertEqual(finishedBuild.status, "EQUAL")
        XCTAssertTrue(queries(route)[3].contains("createSnapshot("))
        XCTAssertTrue(queries(route)[4].contains("finishBuild"), "Finished after the snapshot was created")
    }

    func testCleanupWaitsForAnUploadButLeavesACustomIdBuildOpen() async throws {
        let store = SharedBuildStore()
        let gate = StubURLProtocol.Gate()
        // The lookup misses, so this process creates the build, but other workers may still join it.
        let miss = StubURLProtocol.Reply.json(["data": ["result": NSNull()]])
        let route = StubURLProtocol.Route([miss, created, upload(), stored.held(by: gate), snapshot])
        let visual = try client(route, store: store, options: VisualBuildOptions(name: "Build", customId: "run-1"))

        let check = Task { try await visual.check(name: "Login", png: png) }
        await gate.waitForRequest() // The screenshot PUT is in flight.
        let cleanup = Task {
            let outcome = await store.finishOwnedBuild()
            return (outcome, route.requests.count)
        }
        await waitUntilClosed(store)
        try await Task.sleep(nanoseconds: 100_000_000)

        gate.open()
        let result = try await check.value
        let (outcome, requestsWhenDone) = await cleanup.value
        XCTAssertEqual(result.id, snapshotID)
        XCTAssertEqual(requestsWhenDone, 5, "Cleanup returns only after the admitted check created its snapshot")
        guard case .leftOpen = outcome else { return XCTFail("A customId build stays open") }
        XCTAssertFalse(queries(route).contains { $0.contains("finishBuild") }, "The remote build is not finished")
    }

    func testFinishWaitsForAFailingCheck() async throws {
        let store = SharedBuildStore()
        let gate = StubURLProtocol.Gate()
        let failedUpload = StubURLProtocol.Reply(status: 500, body: Data()).held(by: gate)
        let route = StubURLProtocol.Route([created, upload(), failedUpload, finished])
        let visual = try client(route, store: store)

        let check = Task { try await visual.check(name: "Login", png: png) }
        await gate.waitForRequest()
        let finish = Task { try await visual.finish() }
        await waitUntilClosed(store)
        try await Task.sleep(nanoseconds: 100_000_000)
        XCTAssertEqual(route.requests.count, 3, "finishBuild waits while the check is still running")

        gate.open()
        await XCTAssertThrowsErrorAsync(try await check.value) {
            XCTAssertEqual(($0 as? VisualAPIError)?.code, .apiError)
        }
        let finishedBuild = try await finish.value
        XCTAssertEqual(finishedBuild.status, "EQUAL", "A failed check is released too")
        XCTAssertEqual(route.requests.count, 4)
        XCTAssertTrue(queries(route)[3].contains("finishBuild"))
    }

    func testCheckAdmittedWhileCreatingTheBuildStillCompletes() async throws {
        let store = SharedBuildStore()
        let gate = StubURLProtocol.Gate()
        let route = StubURLProtocol.Route([created.held(by: gate), upload(), stored, snapshot, finished])
        let visual = try client(route, store: store)

        let check = Task { try await visual.check(name: "Login", png: png) }
        await gate.waitForRequest() // createBuild is in flight, and the check is already admitted.
        let finish = Task { try await visual.finish() }
        await waitUntilClosed(store)

        gate.open()
        let result = try await check.value
        let finishedBuild = try await finish.value
        XCTAssertEqual(result.id, snapshotID)
        XCTAssertEqual(finishedBuild.status, "EQUAL")
        XCTAssertEqual(route.requests.count, 5)
        XCTAssertTrue(queries(route)[3].contains("createSnapshot("))
        XCTAssertTrue(queries(route)[4].contains("finishBuild"))
    }

    func testCheckReservesUploadsThenCreatesSnapshot() async throws {
        let route = StubURLProtocol.Route([created, upload(), stored, snapshot])
        let result = try await client(route).check(name: "Login", png: png)

        XCTAssertEqual(result, VisualSnapshot(id: snapshotID, name: "Login", buildId: buildID))
        let requests = route.requests
        XCTAssertEqual(requests.count, 4)

        XCTAssertTrue((route.bodies[1]["query"] as? String)?.contains("createSnapshotUpload") == true)
        XCTAssertEqual(input(route.bodies[1]) as? [String: String], ["buildId": buildID])

        let put = requests[2]
        XCTAssertEqual(put.url, uploadURL)
        XCTAssertEqual(put.httpMethod, "PUT")
        XCTAssertEqual(put.httpBody, png)
        XCTAssertEqual(put.value(forHTTPHeaderField: "Content-Type"), "image/png")
        XCTAssertEqual(put.value(forHTTPHeaderField: "Content-MD5"), "XUFAKrxLKna5cZ2REBfFkg==", "base64 MD5 of \"hello\"")
        XCTAssertNil(put.value(forHTTPHeaderField: "Authorization"), "Presigned URLs must not receive credentials")

        XCTAssertTrue((route.bodies[3]["query"] as? String)?.contains("createSnapshot(") == true)
        let snapshotInput = try XCTUnwrap(input(route.bodies[3]) as? [String: String])
        let device = DeviceInfo.current(environment)
        XCTAssertEqual(snapshotInput, [
            "buildId": buildID, "uploadId": uploadID, "name": "Login",
            "operatingSystem": device.operatingSystem, "operatingSystemVersion": device.operatingSystemVersion,
            "device": "iPhone 15 Pro", "diffingMethod": "BALANCED"
        ])
    }

    func testTestAndSuiteNamesAreSent() async throws {
        let route = StubURLProtocol.Route([created, upload(), stored, snapshot])
        let test = TestIdentity(self)
        let result = try await client(route).check(name: "Login", png: png, request: SnapshotRequest(test: test))

        XCTAssertEqual(result.suiteName, "SnapshotTests")
        XCTAssertEqual(result.testName, "testTestAndSuiteNamesAreSent")
        let snapshotInput = try XCTUnwrap(input(route.bodies[3]))
        XCTAssertEqual(snapshotInput["suiteName"] as? String, "SnapshotTests")
        XCTAssertEqual(snapshotInput["testName"] as? String, "testTestAndSuiteNamesAreSent")
    }

    func testRunningTestIsTrackedFromLoad() {
        // No client has been created yet, so this proves the loader added the observer.
        XCTAssertEqual(CurrentTest.shared.identity,
                       TestIdentity(testName: "testRunningTestIsTrackedFromLoad", suiteName: "SnapshotTests"))
    }

    func testTestIdentity() {
        XCTAssertEqual(TestIdentity(self).overriding(testName: " Login ", suiteName: "  "),
                       TestIdentity(testName: "Login", suiteName: "SnapshotTests"), "Explicit names win, blanks fall back")
        XCTAssertEqual(TestIdentity().overriding(testName: "Login", suiteName: nil).suiteName, nil)
        XCTAssertEqual(TestIdentity.method(from: "-[Module.Suite testSomething]"), "testSomething")
        XCTAssertEqual(TestIdentity.method(from: "Suite.testSomething"), "Suite.testSomething")
    }

    func testChecksShareOneBuild() async throws {
        let route = StubURLProtocol.Route([created, upload(), stored, snapshot, upload(), stored, snapshot])
        let client = try client(route)
        _ = try await client.check(name: "First", png: png)
        _ = try await client.check(name: "Second", png: png)

        let queries = route.bodies.compactMap { $0["query"] as? String }
        XCTAssertEqual(queries.filter { $0.contains("createBuild") }.count, 1)
        XCTAssertEqual(route.requests.count, 7)
    }

    func testSnapshotNamesAreTrimmed() throws {
        XCTAssertEqual(try SnapshotCapture.validName("  Login \n"), "Login")
    }

    func testInvalidOptionsFailBeforeScreenshotOrRequest() async throws {
        let route = StubURLProtocol.Route([created, upload(), stored, snapshot])
        let client = try client(route)
        let tolerance = DiffingMethodTolerance(color: .nan)
        // Unit tests have no screen to capture, so reaching the screenshot would fail differently.
        await XCTAssertThrowsErrorAsync(
            try await client.sauceVisualCheck("Login", options: VisualCheckOptions(diffingMethodTolerance: tolerance))
        ) {
            XCTAssertEqual($0 as? VisualError, .invalidCheckOptions)
        }
        let flipped = CGRect(x: 0, y: 0, width: -10, height: 10)
        await XCTAssertThrowsErrorAsync(
            try await client.sauceVisualCheck("Login", options: VisualCheckOptions(ignoreRegions: [flipped]))
        ) {
            XCTAssertEqual($0 as? VisualError, .invalidCheckOptions)
        }
        // The internal boundary checks too, for requests that skip `SnapshotCapture`.
        let request = SnapshotRequest(diffingMethodTolerance: DiffingMethodTolerance(minChangeSize: -1))
        await XCTAssertThrowsErrorAsync(try await client.check(name: "Login", png: png, request: request)) {
            XCTAssertEqual($0 as? VisualError, .invalidCheckOptions)
        }
        XCTAssertTrue(route.requests.isEmpty, "No build, upload, or snapshot request")
    }

    func testEmptyNameFailsBeforeScreenshotOrRequest() async throws {
        let route = StubURLProtocol.Route([])
        let client = try client(route)
        for name in ["", "  \n"] {
            XCTAssertThrowsError(try SnapshotCapture.validName(name)) {
                XCTAssertEqual($0 as? VisualError, .invalidSnapshotName)
            }
            // Unit tests have no screen to capture, so reaching the screenshot would fail differently.
            await XCTAssertThrowsErrorAsync(try await client.sauceVisualCheck(name)) {
                XCTAssertEqual($0 as? VisualError, .invalidSnapshotName)
            }
        }
        XCTAssertTrue(route.requests.isEmpty)
    }

    func testCheckAfterFinishIsRejected() async throws {
        let route = StubURLProtocol.Route([created, finished])
        let client = try client(route)
        _ = try await client.finish()

        await XCTAssertThrowsErrorAsync(try await client.check(name: "Late", png: png)) {
            XCTAssertEqual($0 as? VisualError, .buildAlreadyCompleted)
        }
        XCTAssertEqual(route.requests.count, 2)
    }

    func testMissingUploadURLIsReported() async throws {
        for reply in [
            StubURLProtocol.Reply.json(["data": ["result": ["id": uploadID, "imageUploadUrl": NSNull()]]]),
            .json(["data": NSNull(), "errors": [["message": "Build not found"]]])
        ] {
            let route = StubURLProtocol.Route([created, reply])
            await XCTAssertThrowsErrorAsync(try await client(route).check(name: "Login", png: png)) {
                XCTAssertEqual(($0 as? VisualAPIError)?.code, .apiError)
            }
            XCTAssertEqual(route.requests.count, 2, "Nothing is uploaded")
        }
    }

    func testFailedUploadDoesNotCreateSnapshot() async throws {
        let route = StubURLProtocol.Route([created, upload(), StubURLProtocol.Reply(status: 403, body: Data("denied".utf8))])
        await XCTAssertThrowsErrorAsync(try await client(route).check(name: "Login", png: png)) {
            let error = $0 as? VisualAPIError
            XCTAssertEqual(error?.code, .apiError, "Storage 403 is not a Sauce credentials problem")
            XCTAssertEqual(error?.statusCode, 403)
            XCTAssertEqual(error?.detail, "Screenshot upload failed with HTTP 403.")
        }
        XCTAssertEqual(route.requests.count, 3)
    }

    func testUploadTransportFailureIsNetworkFailure() async throws {
        let route = StubURLProtocol.Route([created, upload(), .failure(.networkConnectionLost)])
        await XCTAssertThrowsErrorAsync(try await client(route).check(name: "Login", png: png)) {
            XCTAssertEqual(($0 as? VisualAPIError)?.code, .networkFailure)
        }
    }

    func testCreateSnapshotErrorsAreReported() async throws {
        let route = StubURLProtocol.Route([
            created, upload(), stored, .json(["data": NSNull(), "errors": [["message": "Upload not found"]]])
        ])
        await XCTAssertThrowsErrorAsync(try await client(route).check(name: "Login", png: png)) {
            let error = $0 as? VisualAPIError
            XCTAssertEqual(error?.code, .apiError)
            XCTAssertEqual(error?.detail, "The GraphQL operation failed.")
        }
    }

    func testDeviceInfo() {
        let simulator = DeviceInfo.current(["SIMULATOR_MODEL_IDENTIFIER": "iPhone16,1"])
        XCTAssertEqual(simulator.device, "iPhone16,1")
        let version = ProcessInfo.processInfo.operatingSystemVersion
        XCTAssertTrue(simulator.operatingSystemVersion.hasPrefix("\(version.majorVersion).\(version.minorVersion)"))
        XCTAssertNotNil(DeviceInfo.current([:]).device, "Falls back to the hardware model")
        #if os(macOS)
        XCTAssertEqual(simulator.operatingSystem, "MACOS")
        #elseif os(iOS)
        XCTAssertEqual(simulator.operatingSystem, "IOS")
        #else
        XCTAssertEqual(simulator.operatingSystem, "UNKNOWN")
        #endif
    }
}
