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

    private func client(_ route: StubURLProtocol.Route, store: SharedBuildStore = SharedBuildStore()) throws -> VisualClient {
        try VisualClient(
            credentials: nil, region: nil, options: VisualBuildOptions(name: "Build"),
            session: StubURLProtocol.session(route), environment: environment, store: store
        )
    }

    private func input(_ body: [String: Any]) -> [String: Any]? {
        (body["variables"] as? [String: Any])?["input"] as? [String: Any]
    }

    func testCheckReservesUploadsThenCreatesSnapshot() async throws {
        let route = StubURLProtocol.Route([created, upload(), stored, snapshot])
        let result = try await client(route).check(name: "  Login ", png: png)

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
            "operatingSystem": device.operatingSystem.rawValue, "operatingSystemVersion": device.operatingSystemVersion,
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

    func testEmptyNameFailsWithoutRequest() async throws {
        let route = StubURLProtocol.Route([])
        let client = try client(route)
        for name in ["", "  \n"] {
            await XCTAssertThrowsErrorAsync(try await client.check(name: name, png: png)) {
                XCTAssertEqual($0 as? VisualError, .invalidSnapshotName)
            }
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
            XCTAssertEqual(error?.detail, "Upload not found")
        }
    }

    func testDeviceInfo() {
        let simulator = DeviceInfo.current(["SIMULATOR_MODEL_IDENTIFIER": "iPhone16,1"])
        XCTAssertEqual(simulator.device, "iPhone16,1")
        let version = ProcessInfo.processInfo.operatingSystemVersion
        XCTAssertTrue(simulator.operatingSystemVersion.hasPrefix("\(version.majorVersion).\(version.minorVersion)"))
        XCTAssertNotNil(DeviceInfo.current([:]).device, "Falls back to the hardware model")
        #if os(macOS)
        XCTAssertEqual(simulator.operatingSystem, .macos)
        #elseif os(iOS)
        XCTAssertEqual(simulator.operatingSystem, .ios)
        #else
        XCTAssertEqual(simulator.operatingSystem, .unknown)
        #endif
    }
}
