import Foundation

/// Creates, reuses, and finishes the Sauce Visual build for this test run.
///
/// Every client in the process shares one build: the first call to `build()`
/// creates it (or reuses the one named by `buildId` / `customId`), and later clients get the same
/// build regardless of their own options. Call `finish()` once, after the last test.
public actor VisualClient {
    public nonisolated let region: SauceRegion
    public nonisolated let options: VisualBuildOptions
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
        self.api = VisualAPI(region: region, credentials: credentials, session: session)
        self.store = store
    }

    /// The shared build, created on first use. Concurrent first calls make one request.
    /// A failed attempt is not cached, so a later call retries.
    /// - Throws: `VisualError.buildAlreadyCompleted` after `finish()`, `.invalidBuildId`, or `VisualAPIError`.
    public func build() async throws -> VisualBuild {
        try await store.build(api: api, options: options)
    }

    /// Finishes the shared build. Repeated calls return the same result without another request.
    /// Snapshots cannot be added afterwards.
    /// - Throws: `VisualAPIError`, or any error from creating the build.
    public func finish() async throws -> VisualBuild {
        try await store.finish(api: api, options: options)
    }
}

internal actor SharedBuildStore {
    static let shared = SharedBuildStore()

    private var pending: Task<VisualBuild, Error>?
    private var finishing: Task<VisualBuild, Error>?

    func build(api: VisualAPI, options: VisualBuildOptions) async throws -> VisualBuild {
        if finishing != nil { throw VisualError.buildAlreadyCompleted }
        return try await resolve(api: api, options: options)
    }

    func finish(api: VisualAPI, options: VisualBuildOptions) async throws -> VisualBuild {
        if let finishing { return try await finishing.value }
        let build = try await resolve(api: api, options: options)
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
    private func resolve(api: VisualAPI, options: VisualBuildOptions) async throws -> VisualBuild {
        if let pending { return try await pending.value }
        let task = Task { try await api.resolveBuild(options) }
        pending = task
        do {
            return try await task.value
        } catch {
            if pending == task { pending = nil }
            throw error
        }
    }
}
