import Foundation

/// Creates, reuses, and finishes the Sauce Visual build for this test run.
///
/// Every client in the process shares one build: the first call to `build()`
/// creates it (or reuses the one named by `buildId` / `customId`). The build belongs to that client's
/// region, credentials, and build options. Later clients must use the same ones, and then share the
/// first client's connection. A client with a different configuration throws
/// `VisualError.conflictingConfiguration`.
///
/// The build is finished automatically when the XCTest bundle ends only if this process created it
/// without a `buildId` or `customId`. A build named by either ID may be shared by several workers, so it
/// is always left open, even when this process created it: finish it from the step that knows every
/// worker is done, for example by calling `finish()` there.
public actor VisualClient {
    public nonisolated let region: SauceRegion
    public nonisolated let options: VisualBuildOptions
    private let configuration: BuildConfiguration
    private let api: VisualAPI
    private let store: SharedBuildStore

    /// Missing values come from `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`, `SAUCE_REGION`, and `SAUCE_VISUAL_*`.
    /// - Throws: `VisualError.invalidCredentials`, `.unknownRegion`, or `.invalidBuildId`.
    public init(
        credentials: VisualCredentials? = nil,
        region: SauceRegion? = nil,
        options: VisualBuildOptions = VisualBuildOptions(),
        session: URLSession = .shared
    ) throws {
        try self.init(
            credentials: credentials, region: region, options: options, session: session,
            environment: ProcessInfo.processInfo.environment, store: .shared
        )
        AutoFinish.register()
    }

    internal init(
        credentials: VisualCredentials?,
        region: SauceRegion?,
        options: VisualBuildOptions,
        session: URLSession,
        environment: [String: String],
        store: SharedBuildStore
    ) throws {
        let credentials = try credentials ?? VisualCredentials.fromEnvironment(environment)
        let region = try region ?? SauceRegion.fromEnvironment(environment)
        let options = options.resolved(with: environment)
        if let buildId = options.buildId, UUID(uuidString: buildId) == nil { throw VisualError.invalidBuildId }
        self.region = region
        self.options = options
        self.configuration = BuildConfiguration(endpoint: region.graphqlEndpoint, credentials: credentials, options: options)
        self.api = VisualAPI(region: region, credentials: credentials, session: session)
        self.store = store
    }

    /// The shared build, created on first use. Concurrent first calls make one request.
    /// A failed attempt is not cached, so a later call retries.
    /// - Throws: `VisualError.buildAlreadyCompleted` after `finish()`, `.conflictingConfiguration`,
    ///   `.invalidBuildId`, or `VisualAPIError`.
    public func build() async throws -> VisualBuild {
        try await store.run(configuration, api: api).build
    }

    /// Finishes the shared build. Repeated calls return the same result without another request.
    /// Snapshots cannot be added afterwards.
    /// - Throws: `VisualError.conflictingConfiguration`, `VisualAPIError`, or any error from creating the build.
    public func finish() async throws -> VisualBuild {
        try await store.finish(configuration, api: api)
    }
}

/// What decides which build a client belongs to. The `URLSession` is left out on purpose: clients that
/// differ only in session share the build and use the first client's session.
internal struct BuildConfiguration: Hashable, Sendable {
    let endpoint: URL
    let credentials: VisualCredentials
    let options: VisualBuildOptions
}

internal actor SharedBuildStore {
    static let shared = SharedBuildStore()

    /// The shared build, and the API every request for it goes through.
    struct Run: Sendable {
        let build: VisualBuild
        let api: VisualAPI
    }

    /// The configuration the build belongs to, and the API of the client that set it.
    private var owner: (configuration: BuildConfiguration, api: VisualAPI)?
    private var pending: Task<VisualAPI.Resolution, Error>?
    private var finishing: Task<VisualBuild, Error>?

    func run(_ configuration: BuildConfiguration, api: VisualAPI) async throws -> Run {
        let api = try ownerAPI(for: configuration, api)
        if finishing != nil { throw VisualError.buildAlreadyCompleted }
        return Run(build: try await resolve(configuration.options, with: api).build, api: api)
    }

    func finish(_ configuration: BuildConfiguration, api: VisualAPI) async throws -> VisualBuild {
        let api = try ownerAPI(for: configuration, api)
        if let finishing { return try await finishing.value }
        let build = try await resolve(configuration.options, with: api).build
        return try await finish(build, with: api)
    }

    /// Called when the test bundle ends. Finishes the build only if this worker owns finishing it, which is
    /// not the same as having created it: a build named by `buildId` or `customId` may still have other
    /// workers uploading, so it is left open for the step that knows they are all done.
    /// See `VisualAPI.Resolution.ownsFinish`.
    func finishOwnedBuild() async -> AutoFinish.Outcome {
        guard let pending, let owner else { return .noBuild }
        do {
            let resolution = try await pending.value
            guard resolution.ownsFinish else { return .leftOpen(resolution.build) }
            return .finished(try await finish(resolution.build, with: owner.api))
        } catch {
            return .failed(error)
        }
    }

    /// The first caller's configuration owns the build. Matching callers get its API, others are rejected.
    private func ownerAPI(for configuration: BuildConfiguration, _ api: VisualAPI) throws -> VisualAPI {
        guard let owner else {
            owner = (configuration, api)
            return api
        }
        guard owner.configuration == configuration else { throw VisualError.conflictingConfiguration }
        return owner.api
    }

    private func finish(_ build: VisualBuild, with api: VisualAPI) async throws -> VisualBuild {
        // Another caller may have started finishing while this one waited.
        if let finishing { return try await finishing.value }
        let task = Task { try await api.finishBuild(build) }
        finishing = task
        do {
            return try await task.value
        } catch {
            // Allow a retry, for example after a network failure.
            if finishing == task { finishing = nil }
            throw error
        }
    }

    /// The request runs in its own task, so one caller's cancellation does not fail the others.
    /// A failure releases the owner too, so a retry may use another configuration.
    private func resolve(_ options: VisualBuildOptions, with api: VisualAPI) async throws -> VisualAPI.Resolution {
        if let pending { return try await pending.value }
        let task = Task { try await api.resolveBuild(options) }
        pending = task
        do {
            return try await task.value
        } catch {
            if pending == task {
                pending = nil
                owner = nil
            }
            throw error
        }
    }
}
