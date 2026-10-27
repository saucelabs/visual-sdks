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
    /// A `buildId` must name an existing build: it is never replaced by a new one. Otherwise a running
    /// build with the `customId` is reused, or a new build is created with it, so later runs with the same
    /// ID find it. A lookup only counts as a miss when the API returns an explicit `null` without errors.
    /// - Throws: `VisualError.invalidBuildId`, `.buildNotFound`, `.buildAlreadyCompleted`, `VisualAPIError`, or
    ///   `UncertainCreation` when `createBuild` failed after the server may have created the build.
    func resolveBuild(_ options: VisualBuildOptions) async throws -> Resolution {
        if let buildId = options.buildId {
            guard let uuid = UUID(uuidString: buildId) else { throw VisualError.invalidBuildId }
            guard let existing = try await build(id: uuid) else { throw VisualError.buildNotFound }
            return .reused(try Self.reusable(existing))
        }
        if let customId = options.customId, let existing = try await build(customId: customId) {
            return .reused(try Self.reusable(existing))
        }
        let build: VisualBuild
        do {
            build = try await createBuild(options)
        } catch {
            if Self.mayHaveBeenApplied(error) { throw UncertainCreation(underlying: error) }
            throw error
        }
        // Other workers may join a build named by an ID, so creating it does not make this worker the finisher.
        return Resolution(build: build, created: true, ownsFinish: !options.namesBuild)
    }

    /// Creating a build and finishing it are separate: whoever knows that every worker is done
    /// finishes a shared build, and that may not be the worker that created it.
    struct Resolution: Sendable {
        let build: VisualBuild
        /// This worker created the build, rather than reusing an existing one.
        let created: Bool
        /// This worker finishes the build when its tests end. True only for a build it created without a
        /// `buildId` or `customId`, since no other worker can be adding to that one.
        let ownsFinish: Bool

        static func reused(_ build: VisualBuild) -> Resolution {
            Resolution(build: build, created: false, ownsFinish: false)
        }
    }

    /// `createBuild` failed, but the server may still have created the build, for example when the
    /// response was lost. Only lookups may follow, so a second build is never created.
    struct UncertainCreation: Error {
        let underlying: Error
    }

    /// Finds the build an uncertain creation with this `customId` may have made. Never creates one.
    /// - Returns: The build, or `nil` when the service has no running build with this ID.
    /// - Throws: `VisualError.buildAlreadyCompleted` or `VisualAPIError`.
    func reconcileCreation(customId: String) async throws -> Resolution? {
        guard let existing = try await build(customId: customId) else { return nil }
        return .reused(try Self.reusable(existing))
    }

    /// Finishes a build whose last `finishBuild` may have been applied. Looks the build up first, and
    /// sends `finishBuild` again only while the service still reports it running.
    /// - Throws: `VisualError.buildNotFound` or `VisualAPIError`.
    func reconcileFinish(_ build: VisualBuild) async throws -> VisualBuild {
        guard let id = UUID(uuidString: build.id), let current = try await self.build(id: id) else {
            throw VisualError.buildNotFound
        }
        guard current.isCompleted else { return try await finishBuild(build) }
        return Self.updated(build, with: current)
    }

    /// True unless the error shows the request changed nothing on the server. An interrupted request
    /// (`CancellationError` included) may already have been sent.
    static func mayHaveBeenApplied(_ error: Error) -> Bool {
        (error as? VisualAPIError)?.mayHaveBeenApplied ?? true
    }

    func createBuild(_ options: VisualBuildOptions) async throws -> VisualBuild {
        let input = GraphQL.BuildIn(
            name: options.name,
            project: options.project,
            branch: options.branch,
            defaultBranch: options.defaultBranch,
            customId: options.customId
        )
        let result = try await transport.execute(
            Self.createBuildMutation, variables: GraphQL.Input(input: input), as: GraphQL.BuildResponse.self
        )
        return try Self.require(result).build
    }

    private func build(id: UUID) async throws -> GraphQL.BuildResponse? {
        try await transport.execute(
            Self.buildQuery, variables: GraphQL.Input(input: id.uuidString.lowercased()), as: GraphQL.BuildResponse.self
        )
    }

    private func build(customId: String) async throws -> GraphQL.BuildResponse? {
        try await transport.execute(
            Self.buildByCustomIdQuery, variables: GraphQL.Input(input: customId), as: GraphQL.BuildResponse.self
        )
    }

    func finishBuild(_ build: VisualBuild) async throws -> VisualBuild {
        let result = try await transport.execute(
            Self.finishBuildMutation, variables: GraphQL.Input(input: GraphQL.FinishBuildIn(uuid: build.id)),
            as: GraphQL.BuildResponse.self
        )
        return Self.updated(build, with: try Self.require(result))
    }

    /// The build with the name, status, and URL the service reports now.
    private static func updated(_ build: VisualBuild, with current: GraphQL.BuildResponse) -> VisualBuild {
        VisualBuild(
            id: build.id,
            name: current.name ?? build.name,
            project: build.project,
            branch: build.branch,
            defaultBranch: build.defaultBranch,
            status: current.status ?? build.status,
            url: current.url ?? build.url,
            customId: build.customId
        )
    }

    private static func reusable(_ existing: GraphQL.BuildResponse) throws -> VisualBuild {
        guard !existing.isCompleted else { throw VisualError.buildAlreadyCompleted }
        return existing.build
    }

    /// Mutations must return a value. GraphQL errors are already thrown by the transport.
    private static func require(_ result: GraphQL.BuildResponse?) throws -> GraphQL.BuildResponse {
        guard let result else { throw VisualAPIError(code: .apiError, detail: "Empty result.") }
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
