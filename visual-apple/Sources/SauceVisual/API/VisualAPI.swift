import Foundation

/// Sauce Visual build operations.
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

    /// Reuses the build named by `buildId` or `customId`, otherwise creates one.
    ///
    /// `buildId` is checked first, then `customId`. A new build keeps the `customId`, so later runs
    /// with the same ID find it.
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

    /// `created` is false when an existing build was reused. Whoever created that build finishes it.
    struct Resolution: Sendable {
        let build: VisualBuild
        let created: Bool
    }

    func createBuild(_ options: VisualBuildOptions) async throws -> VisualBuild {
        let input = BuildIn(
            name: options.name,
            project: options.project,
            branch: options.branch,
            defaultBranch: options.defaultBranch,
            customId: options.customId
        )
        let response = try await transport.execute(
            Self.createBuildMutation, variables: Input(input: input), as: BuildResult.self
        )
        return try Self.require(response).build
    }

    func build(id: UUID) async throws -> ExistingBuild? {
        let response = try await transport.execute(
            Self.buildQuery, variables: Input(input: id.uuidString.lowercased()), as: BuildResult.self
        )
        return response.result.map(ExistingBuild.init)
    }

    func build(customId: String) async throws -> ExistingBuild? {
        let response = try await transport.execute(
            Self.buildByCustomIdQuery, variables: Input(input: customId), as: BuildResult.self
        )
        return response.result.map(ExistingBuild.init)
    }

    func finishBuild(_ build: VisualBuild) async throws -> VisualBuild {
        let response = try await transport.execute(
            Self.finishBuildMutation, variables: Input(input: FinishBuildIn(uuid: build.id)), as: BuildResult.self
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

    struct ExistingBuild: Sendable {
        let build: VisualBuild
        let isCompleted: Bool

        init(_ result: BuildResult) {
            build = result.build
            isCompleted = result.mode == "COMPLETED"
        }
    }

    private static func reusable(_ existing: ExistingBuild) throws -> VisualBuild {
        guard !existing.isCompleted else { throw VisualError.buildAlreadyCompleted }
        return existing.build
    }

    /// Mutations must return a value. GraphQL errors explain a missing one.
    private static func require(_ response: GraphQLTransport.Response<BuildResult>) throws -> BuildResult {
        guard let result = response.result else {
            let detail = response.errorMessages.isEmpty ? "Empty result." : response.errorMessages.joined(separator: ", ")
            throw VisualAPIError(code: .apiError, detail: detail)
        }
        return result
    }

    // MARK: - Wire types

    private struct Input<Value: Encodable & Sendable>: Encodable, Sendable {
        let input: Value
    }

    private struct BuildIn: Encodable, Sendable {
        let name: String?
        let project: String?
        let branch: String?
        let defaultBranch: String?
        let customId: String?
    }

    private struct FinishBuildIn: Encodable, Sendable {
        let uuid: String
    }

    struct BuildResult: Decodable, Sendable {
        let id: String
        let name: String?
        let project: String?
        let branch: String?
        let defaultBranch: String?
        let status: String?
        let url: String?
        let customId: String?
        let mode: String?

        var build: VisualBuild {
            VisualBuild(
                id: id, name: name, project: project, branch: branch, defaultBranch: defaultBranch,
                status: status, url: url, customId: customId
            )
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
