import Foundation
import XCTest
// Release runs need `-Xswiftc -enable-testing` for this import.
@testable import SauceVisual

// Test-only: no mutable instance state, XCTest owns its synchronization.
final class VisualAPITests: XCTestCase, @unchecked Sendable {
    private let buildID = "0f8fad5b-d9cb-469f-a165-70867728950e"
    /// Requests never leave the process: `StubURLProtocol` answers them.
    private let region = SauceRegion(name: "test", graphqlEndpoint: URL(string: "https://visual.test/graphql")!)

    private func api(_ replies: [StubURLProtocol.Reply]) throws -> (VisualAPI, StubURLProtocol.Route) {
        let route = StubURLProtocol.Route(replies)
        let credentials = try VisualCredentials(username: "user", accessKey: "super-secret")
        let api = VisualAPI(region: region, credentials: credentials, session: StubURLProtocol.session(route))
        return (api, route)
    }

    private func build(mode: String = "RUNNING", customId: String? = nil) -> [String: Any] {
        var result: [String: Any] = [
            "id": buildID, "name": "Build", "project": "Project", "branch": "feature",
            "defaultBranch": "main", "status": "RUNNING", "url": "https://visual.test/builds/\(buildID)",
            "mode": mode
        ]
        if let customId { result["customId"] = customId }
        return ["data": ["result": result]]
    }

    func testCreateBuildSendsHeadersAndAttributes() async throws {
        let (api, route) = try api([.json(build())])
        let options = VisualBuildOptions(
            name: "Build", project: "Project", branch: "feature", defaultBranch: "main"
        )
        let created = try await api.resolveBuild(options)

        XCTAssertEqual(created.id, buildID)
        XCTAssertEqual(created.url, "https://visual.test/builds/\(buildID)")
        let request = try XCTUnwrap(route.requests.first)
        XCTAssertEqual(request.url, region.graphqlEndpoint)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Basic dXNlcjpzdXBlci1zZWNyZXQ=")
        XCTAssertEqual(request.value(forHTTPHeaderField: "User-Agent"), "sauce-visual-apple/\(sauceVisualVersion)")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(route.requests.count, 1)
        let input = try XCTUnwrap((route.bodies[0]["variables"] as? [String: Any])?["input"] as? [String: String])
        XCTAssertEqual(input, ["name": "Build", "project": "Project", "branch": "feature", "defaultBranch": "main"])
    }

    func testCustomIdLookupThenCreateKeepsCustomId() async throws {
        let (api, route) = try api([.json(["data": ["result": NSNull()]]), .json(build(customId: "ci-42"))])
        let created = try await api.resolveBuild(VisualBuildOptions(name: "Build", customId: "ci-42"))

        XCTAssertEqual(created.customId, "ci-42")
        let bodies = route.bodies
        XCTAssertEqual(bodies.count, 2)
        XCTAssertTrue((bodies[0]["query"] as? String)?.contains("buildByCustomId") == true)
        XCTAssertEqual(bodies[0]["variables"] as? [String: String], ["input": "ci-42"])
        XCTAssertTrue((bodies[1]["query"] as? String)?.contains("createBuild") == true)
        let input = try XCTUnwrap((bodies[1]["variables"] as? [String: Any])?["input"] as? [String: String])
        XCTAssertEqual(input, ["name": "Build", "customId": "ci-42"])
    }

    func testRunningBuildIsReusedById() async throws {
        let (api, route) = try api([.json(build())])
        let reused = try await api.resolveBuild(VisualBuildOptions(buildId: buildID.uppercased()))

        XCTAssertEqual(reused.id, buildID)
        XCTAssertEqual(route.bodies.count, 1)
        XCTAssertEqual(route.bodies[0]["variables"] as? [String: String], ["input": buildID])
    }

    func testRunningBuildIsReusedByCustomId() async throws {
        let (api, route) = try api([.json(build(customId: "ci-42"))])
        let reused = try await api.resolveBuild(VisualBuildOptions(customId: "ci-42"))

        XCTAssertEqual(reused.customId, "ci-42")
        XCTAssertEqual(route.requests.count, 1)
    }

    func testCompletedBuildIsRejected() async throws {
        for options in [VisualBuildOptions(buildId: buildID), VisualBuildOptions(customId: "ci-42")] {
            let (api, _) = try api([.json(build(mode: "COMPLETED"))])
            await XCTAssertThrowsErrorAsync(try await api.resolveBuild(options)) {
                XCTAssertEqual($0 as? VisualError, .buildAlreadyCompleted)
            }
        }
    }

    func testInvalidBuildIdFailsWithoutRequest() async throws {
        let (api, route) = try api([])
        await XCTAssertThrowsErrorAsync(try await api.resolveBuild(VisualBuildOptions(buildId: "not-a-uuid"))) {
            XCTAssertEqual($0 as? VisualError, .invalidBuildId)
        }
        XCTAssertTrue(route.requests.isEmpty)
    }

    func testMissingBuildIdFallsBackToCreate() async throws {
        let (api, route) = try api([.json(["data": ["result": NSNull()]]), .json(build())])
        _ = try await api.resolveBuild(VisualBuildOptions(buildId: buildID))
        XCTAssertTrue((route.bodies.last?["query"] as? String)?.contains("createBuild") == true)
    }

    func testFinishBuildUpdatesStatus() async throws {
        let (api, route) = try api([
            .json(build()),
            .json(["data": ["result": ["id": buildID, "name": "Build", "status": "EQUAL", "url": "http://done"]]])
        ])
        let created = try await api.createBuild(VisualBuildOptions(name: "Build"))
        let finished = try await api.finishBuild(created)

        XCTAssertEqual(finished.status, "EQUAL")
        XCTAssertEqual(finished.url, "http://done")
        XCTAssertEqual(finished.project, "Project")
        let input = (route.bodies[1]["variables"] as? [String: Any])?["input"] as? [String: String]
        XCTAssertEqual(input, ["uuid": buildID])
    }

    func testGraphQLErrorsAreReported() async throws {
        let (api, _) = try api([.json(["data": NSNull(), "errors": [["message": "Project not found"]]])])
        await XCTAssertThrowsErrorAsync(try await api.createBuild(VisualBuildOptions())) {
            let error = $0 as? VisualAPIError
            XCTAssertEqual(error?.code, .apiError)
            XCTAssertEqual(error?.detail, "Project not found")
        }
    }

    func testUnauthorizedMapsToInvalidCredentialsWithoutLeakingKey() async throws {
        let (api, _) = try api([StubURLProtocol.Reply(status: 401, body: Data("Unauthorized".utf8))])
        await XCTAssertThrowsErrorAsync(try await api.createBuild(VisualBuildOptions())) {
            let error = $0 as? VisualAPIError
            XCTAssertEqual(error?.code, .invalidCredentials)
            XCTAssertEqual(error?.statusCode, 401)
            XCTAssertEqual("\($0)", "Invalid Sauce Labs credentials. Check your username and access key.")
            XCTAssertFalse("\($0) \(($0 as NSError).localizedDescription)".contains("super-secret"))
        }
    }

    func testServerAndTransportFailures() async throws {
        let cases: [(StubURLProtocol.Reply, VisualError)] = [
            (StubURLProtocol.Reply(status: 500, body: Data()), .apiError),
            (StubURLProtocol.Reply(body: Data("<html>".utf8)), .apiError),
            (.failure(.cannotConnectToHost), .networkFailure),
            (.failure(.timedOut), .networkFailure)
        ]
        for (reply, expected) in cases {
            let (api, _) = try api([reply])
            await XCTAssertThrowsErrorAsync(try await api.createBuild(VisualBuildOptions())) {
                XCTAssertEqual(($0 as? VisualAPIError)?.code, expected)
            }
        }
        let (api, _) = try api([.failure(.cannotConnectToHost)])
        await XCTAssertThrowsErrorAsync(try await api.createBuild(VisualBuildOptions())) {
            XCTAssertEqual("\($0)", "Could not reach the Sauce Visual API. Could not connect to the server.")
        }
    }

    func testCancellationIsNotReportedAsNetworkFailure() async throws {
        let (api, _) = try api([.failure(.cancelled)])
        await XCTAssertThrowsErrorAsync(try await api.createBuild(VisualBuildOptions())) {
            XCTAssertTrue($0 is CancellationError, "\($0)")
        }
    }
}

func XCTAssertThrowsErrorAsync<T>(
    _ expression: @autoclosure () async throws -> T,
    file: StaticString = #filePath,
    line: UInt = #line,
    _ handler: (Error) -> Void = { _ in }
) async {
    do {
        _ = try await expression()
        XCTFail("Expected an error", file: file, line: line)
    } catch {
        handler(error)
    }
}
