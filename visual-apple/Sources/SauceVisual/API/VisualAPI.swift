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

    private static func reusable(_ existing: GraphQL.BuildResponse) throws -> VisualBuild {
        guard !existing.isCompleted else { throw VisualError.buildAlreadyCompleted }
        return existing.build
    }

    /// Mutations must return a value. GraphQL errors explain a missing one.
    private static func require(
        _ response: GraphQLTransport.Response<GraphQL.BuildResponse>
    ) throws -> GraphQL.BuildResponse {
        guard let result = response.result else {
            let detail = response.errorMessages.isEmpty ? "Empty result." : response.errorMessages.joined(separator: ", ")
            throw VisualAPIError(code: .apiError, detail: detail)
        }
        return result
    }

    // MARK: - GraphQL request and response shapes

    /// The exact JSON the API sends and receives. Users only see `VisualBuildOptions` and `VisualBuild`.
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
