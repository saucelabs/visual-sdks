import CryptoKit
import Foundation

/// Sauce Visual build and snapshot operations.
internal struct VisualAPI: Sendable {
    let transport: GraphQLTransport

    init(transport: GraphQLTransport) {
        self.transport = transport
    }

    init(region: SauceRegion, credentials: VisualCredentials, session: URLSession = .shared) {
        self.init(transport: GraphQLTransport(
            endpoint: region.graphqlEndpoint,
            credentials: credentials,
            session: session
        ))
    }

    /// Reuses the build named by `buildId`, then `customId`, otherwise creates one with that `customId`.
    /// - Throws: `VisualError.invalidBuildId`, `.buildAlreadyCompleted`, or `VisualAPIError`.
    func resolveBuild(_ options: VisualBuildOptions) async throws -> Resolution {
        if let buildId = options.buildId {
            guard let uuid = UUID(uuidString: buildId) else { throw VisualError.invalidBuildId }
            if let existing = try await build(id: uuid) { return Resolution(build: try Self.reusable(existing), created: false) }
        }
        if let customId = options.customId, let existing = try await build(customId: customId) {
            return Resolution(build: try Self.reusable(existing), created: false)
        }
        return Resolution(build: try await createBuild(options), created: true)
    }

    /// `created` is false for a reused build, which is left for its creator to finish.
    struct Resolution: Sendable {
        let build: VisualBuild
        let created: Bool
    }

    func createBuild(_ options: VisualBuildOptions) async throws -> VisualBuild {
        let input = GraphQL.BuildIn(
            name: options.name,
            project: options.project,
            branch: options.branch,
            defaultBranch: options.defaultBranch,
            customId: options.customId
        )
        let response = try await transport.execute(
            Self.createBuildMutation, variables: GraphQL.Input(input: input), as: GraphQL.BuildResponse.self
        )
        return try Self.require(response).build
    }

    private func build(id: UUID) async throws -> GraphQL.BuildResponse? {
        let response = try await transport.execute(
            Self.buildQuery, variables: GraphQL.Input(input: id.uuidString.lowercased()), as: GraphQL.BuildResponse.self
        )
        return response.result
    }

    private func build(customId: String) async throws -> GraphQL.BuildResponse? {
        let response = try await transport.execute(
            Self.buildByCustomIdQuery, variables: GraphQL.Input(input: customId), as: GraphQL.BuildResponse.self
        )
        return response.result
    }

    func finishBuild(_ build: VisualBuild) async throws -> VisualBuild {
        let response = try await transport.execute(
            Self.finishBuildMutation, variables: GraphQL.Input(input: GraphQL.FinishBuildIn(uuid: build.id)),
            as: GraphQL.BuildResponse.self
        )
        let finished = try Self.require(response)
        return VisualBuild(
            id: build.id,
            name: finished.name ?? build.name,
            project: build.project,
            branch: build.branch,
            defaultBranch: build.defaultBranch,
            status: finished.status ?? build.status,
            url: finished.url ?? build.url,
            customId: build.customId
        )
    }

    /// Uploads the screenshot, then creates snapshot `name` from it.
    /// - Throws: `VisualAPIError`, or `CancellationError`.
    func createSnapshot(
        name: String, png: Data, device: DeviceInfo, request: SnapshotRequest, in build: VisualBuild
    ) async throws -> VisualSnapshot {
        let upload = try await createSnapshotUpload(buildId: build.id)
        guard let url = upload.imageUploadUrl.flatMap(URL.init(string:)) else {
            throw VisualAPIError(code: .apiError, detail: "No image upload URL.")
        }
        try await uploadImage(png, to: url)
        let test = request.test
        let input = GraphQL.SnapshotIn(
            buildId: build.id,
            uploadId: upload.id,
            name: name,
            testName: test.testName,
            suiteName: test.suiteName,
            operatingSystem: device.operatingSystem.rawValue,
            operatingSystemVersion: device.operatingSystemVersion,
            device: device.device,
            ignoreRegions: request.regions.isEmpty ? nil : request.regions.map(GraphQL.RegionIn.init),
            diffingMethod: request.diffingMethod.rawValue,
            diffingOptions: request.diffingOptions.map(GraphQL.DiffingOptionsIn.init),
            diffingMethodSensitivity: request.diffingMethodSensitivity?.rawValue,
            diffingMethodTolerance: request.diffingMethodTolerance.map(GraphQL.DiffingMethodToleranceIn.init),
            baselineOverride: request.baselineOverride.flatMap { $0.isEmpty ? nil : GraphQL.BaselineOverrideIn($0) }
        )
        let response = try await transport.execute(
            Self.createSnapshotMutation, variables: GraphQL.Input(input: input), as: GraphQL.SnapshotResult.self
        )
        let snapshot = try Self.require(response)
        return VisualSnapshot(
            id: snapshot.id, name: name, buildId: build.id, testName: test.testName, suiteName: test.suiteName
        )
    }

    private func createSnapshotUpload(buildId: String) async throws -> GraphQL.SnapshotUploadResult {
        let response = try await transport.execute(
            Self.createSnapshotUploadMutation, variables: GraphQL.Input(input: GraphQL.SnapshotUploadIn(buildId: buildId)),
            as: GraphQL.SnapshotUploadResult.self
        )
        return try Self.require(response)
    }

    /// The upload URL already grants access, so no credentials are sent. The MD5 catches corrupted uploads.
    func uploadImage(_ png: Data, to url: URL) async throws {
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("image/png", forHTTPHeaderField: "Content-Type")
        request.setValue(Data(Insecure.MD5.hash(data: png)).base64EncodedString(), forHTTPHeaderField: "Content-MD5")
        request.httpBody = png
        let (_, status) = try await GraphQLTransport.send(request, with: transport.session)
        guard (200..<300).contains(status) else {
            throw VisualAPIError(code: .apiError, detail: "Screenshot upload failed with HTTP \(status).", statusCode: status)
        }
    }

    private static func reusable(_ existing: GraphQL.BuildResponse) throws -> VisualBuild {
        guard !existing.isCompleted else { throw VisualError.buildAlreadyCompleted }
        return existing.build
    }

    /// Returns the result, or throws the server's error messages when there is none.
    private static func require<Result>(_ response: GraphQLTransport.Response<Result>) throws -> Result {
        guard let result = response.result else {
            let detail = response.errorMessages.isEmpty ? "Empty result." : response.errorMessages.joined(separator: ", ")
            throw VisualAPIError(code: .apiError, detail: detail)
        }
        return result
    }

    // MARK: - GraphQL request and response shapes

    /// The exact JSON the API sends and receives. Users only see the public models, such as `VisualBuild` and `VisualSnapshot`.
    private enum GraphQL {
        struct Input<Value: Encodable & Sendable>: Encodable, Sendable {
            let input: Value
        }

        struct BuildIn: Encodable, Sendable {
            let name: String?
            let project: String?
            let branch: String?
            let defaultBranch: String?
            let customId: String?
        }

        struct FinishBuildIn: Encodable, Sendable {
            let uuid: String
        }

        struct SnapshotUploadIn: Encodable, Sendable {
            let buildId: String
        }

        struct SnapshotIn: Encodable, Sendable {
            let buildId: String
            let uploadId: String
            let name: String
            let testName: String?
            let suiteName: String?
            let operatingSystem: String
            let operatingSystemVersion: String
            let device: String?
            let ignoreRegions: [RegionIn]?
            let diffingMethod: String
            let diffingOptions: DiffingOptionsIn?
            let diffingMethodSensitivity: String?
            let diffingMethodTolerance: DiffingMethodToleranceIn?
            let baselineOverride: BaselineOverrideIn?
        }

        /// Fields left `nil` are omitted, so the snapshot's own value is used for them.
        struct BaselineOverrideIn: Encodable, Sendable {
            let name: String?
            let testName: String?
            let suiteName: String?
            let device: String?
            let operatingSystem: String?
            let operatingSystemVersion: String?

            init(_ value: BaselineOverride) {
                name = value.name
                testName = value.testName
                suiteName = value.suiteName
                device = value.device
                operatingSystem = value.operatingSystem?.rawValue
                operatingSystemVersion = value.operatingSystemVersion
            }
        }

        struct RegionIn: Encodable, Sendable {
            let x: Int
            let y: Int
            let width: Int
            let height: Int
            let name: String?
            /// `nil` ignores the region.
            let diffingOptions: DiffingOptionsIn?

            init(_ region: PixelRegion) {
                x = region.x
                y = region.y
                width = region.width
                height = region.height
                name = region.name
                diffingOptions = region.diffingOptions.map(DiffingOptionsIn.init)
            }
        }

        /// Sends every flag, so an option you left out means "don't report" rather than the default.
        struct DiffingOptionsIn: Encodable, Sendable {
            let content: Bool
            let dimensions: Bool
            let position: Bool
            let structure: Bool
            let style: Bool
            let visual: Bool

            init(_ options: DiffingOptions) {
                content = options.contains(.content)
                dimensions = options.contains(.dimensions)
                position = options.contains(.position)
                structure = options.contains(.structure)
                style = options.contains(.style)
                visual = options.contains(.visual)
            }
        }

        struct DiffingMethodToleranceIn: Encodable, Sendable {
            let color: Double?
            let brightness: Double?
            let antiAliasing: Double?
            let minChangeSize: Int?

            init(_ tolerance: DiffingMethodTolerance) {
                color = tolerance.color
                brightness = tolerance.brightness
                antiAliasing = tolerance.antiAliasing
                minChangeSize = tolerance.minChangeSize
            }
        }

        struct SnapshotUploadResult: Decodable, Sendable {
            let id: String
            let imageUploadUrl: String?
        }

        struct SnapshotResult: Decodable, Sendable {
            let id: String
        }

        /// `mode` is only fetched when looking up a build to reuse; `finishBuild` returns just a few fields.
        struct BuildResponse: Decodable, Sendable {
            let id: String
            let name: String?
            let project: String?
            let branch: String?
            let defaultBranch: String?
            let status: String?
            let url: String?
            let customId: String?
            let mode: String?

            /// A finished build can't take more snapshots, so it isn't reused.
            var isCompleted: Bool { mode == "COMPLETED" }

            var build: VisualBuild {
                VisualBuild(
                    id: id, name: name, project: project, branch: branch, defaultBranch: defaultBranch,
                    status: status, url: url, customId: customId
                )
            }
        }
    }

    // MARK: - Operations

    static let createBuildMutation = """
    mutation createBuild($input: BuildIn!) {
        result: createBuild(input: $input) {
            id name project branch defaultBranch status url customId
        }
    }
    """

    static let finishBuildMutation = """
    mutation finishBuild($input: FinishBuildIn!) {
        result: finishBuild(input: $input) {
            id name status url
        }
    }
    """

    static let createSnapshotUploadMutation = """
    mutation createSnapshotUpload($input: SnapshotUploadIn!) {
        result: createSnapshotUpload(input: $input) {
            id imageUploadUrl
        }
    }
    """

    static let createSnapshotMutation = """
    mutation createSnapshot($input: SnapshotIn!) {
        result: createSnapshot(input: $input) {
            id
        }
    }
    """

    static let buildQuery = """
    query build($input: UUID!) {
        result: build(id: $input) {
            id name project branch defaultBranch status url customId mode
        }
    }
    """

    static let buildByCustomIdQuery = """
    query buildByCustomId($input: String!) {
        result: buildByCustomId(customId: $input) {
            id name project branch defaultBranch status url customId mode
        }
    }
    """
}
