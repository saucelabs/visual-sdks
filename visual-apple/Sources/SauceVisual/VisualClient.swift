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
        var options = options.resolved(with: environment)
        if let buildId = options.buildId {
            guard let uuid = UUID(uuidString: buildId) else { throw VisualError.invalidBuildId }
            // One spelling per build, so clients that name it differently still share it.
            options.buildId = uuid.uuidString.lowercased()
        }
        self.region = region
        self.options = options
        self.configuration = BuildConfiguration(endpoint: region.graphqlEndpoint, credentials: credentials, options: options)
        self.api = VisualAPI(region: region, credentials: credentials, session: session)
        self.store = store
    }

    /// The shared build, created on first use. Concurrent first calls make one request.
    /// A failed attempt is retried by a later call, unless the service may already have created the build:
    /// then a build with a `customId` is looked up, and any other keeps failing with the same error.
    /// - Throws: `VisualError.buildAlreadyCompleted` once finishing has started, `.conflictingConfiguration`,
    ///   `.invalidBuildId`, `VisualAPIError`, or `CancellationError`.
    public func build() async throws -> VisualBuild {
        try await store.run(configuration, api: api).build
    }

    /// Finishes the shared build. Repeated calls return the same result without another request.
    /// Snapshots cannot be added once finishing starts, even if it fails. A later call retries, checking
    /// the build first when the failed request may have been applied.
    /// - Throws: `VisualError.conflictingConfiguration`, `VisualAPIError`, `CancellationError`, or any error
    ///   from creating the build.
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
    /// The creation in flight, or its result once it succeeded.
    private var pending: Task<VisualAPI.Resolution, Error>?
    /// Set when creation failed after the service may have created the build. The owner is kept with it,
    /// so no later call creates a second build or binds another configuration.
    private var uncertainCreation: Error?
    private var finishing: Task<VisualBuild, Error>?
    /// Set when a failed `finishBuild` may have been applied, so the next attempt looks the build up first.
    private var finishMayHaveBeenApplied = false
    /// Set when finishing starts and never cleared, even when finishing fails: a failed finish may still
    /// have been applied, so no more snapshots may join the run.
    private(set) var isClosed = false

    func run(_ configuration: BuildConfiguration, api: VisualAPI) async throws -> Run {
        // Nothing is bound or started for a caller that is already cancelled.
        try Task.checkCancellation()
        let api = try ownerAPI(for: configuration, api)
        if isClosed { throw VisualError.buildAlreadyCompleted }
        let build = try await resolve(configuration.options, with: api).build
        // The shared creation keeps going for other callers; only this one stops.
        try Task.checkCancellation()
        return Run(build: build, api: api)
    }

    func finish(_ configuration: BuildConfiguration, api: VisualAPI) async throws -> VisualBuild {
        try Task.checkCancellation()
        let api = try ownerAPI(for: configuration, api)
        // Closed before the first suspension, so nothing is admitted after finishing starts.
        isClosed = true
        if let finishing { return try await finishing.value }
        let build = try await resolve(configuration.options, with: api).build
        return try await finish(build, with: api)
    }

    /// Called when the test bundle ends. Finishes the build only if this worker owns finishing it, which is
    /// not the same as having created it: a build named by `buildId` or `customId` may still have other
    /// workers uploading, so it is left open for the step that knows they are all done.
    /// See `VisualAPI.Resolution.ownsFinish`.
    func finishOwnedBuild() async -> AutoFinish.Outcome {
        if pending == nil, let uncertainCreation { return .failed(uncertainCreation) }
        guard let pending, let owner else { return .noBuild }
        isClosed = true
        do {
            let resolution = try await pending.value
            guard resolution.ownsFinish else { return .leftOpen(resolution.build) }
            return .finished(try await finish(resolution.build, with: owner.api))
        } catch let error as VisualAPI.UncertainCreation {
            return .failed(error.underlying)
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
        let reconcile = finishMayHaveBeenApplied
        let task = Task { reconcile ? try await api.reconcileFinish(build) : try await api.finishBuild(build) }
        finishing = task
        do {
            return try await task.value
        } catch {
            if finishing == task {
                // The next call retries. Admission stays closed either way.
                finishing = nil
                if VisualAPI.mayHaveBeenApplied(error) { finishMayHaveBeenApplied = true }
            }
            throw error
        }
    }

    /// The request runs in its own task, so one caller's cancellation does not fail the others.
    /// A failure that certainly created nothing releases the owner too, so a retry may use another
    /// configuration. After an uncertain creation, only a build with a `customId` is looked up again.
    private func resolve(_ options: VisualBuildOptions, with api: VisualAPI) async throws -> VisualAPI.Resolution {
        if let pending {
            do {
                return try await pending.value
            } catch let error as VisualAPI.UncertainCreation {
                throw error.underlying
            }
        }
        let task: Task<VisualAPI.Resolution, Error>
        if let uncertainCreation {
            guard let customId = options.customId else { throw uncertainCreation }
            task = Task {
                guard let found = try await api.reconcileCreation(customId: customId) else { throw uncertainCreation }
                return found
            }
        } else {
            task = Task { try await api.resolveBuild(options) }
        }
        pending = task
        do {
            let resolution = try await task.value
            if pending == task { uncertainCreation = nil }
            return resolution
        } catch let error as VisualAPI.UncertainCreation {
            if pending == task {
                pending = nil
                uncertainCreation = error.underlying
            }
            throw error.underlying
        } catch {
            if pending == task {
                pending = nil
                // A failed lookup after an uncertain creation settles nothing, so that state is kept.
                if uncertainCreation == nil { owner = nil }
            }
            throw error
        }
    }
}
