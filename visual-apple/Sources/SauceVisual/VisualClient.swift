import Foundation

/// Takes Sauce Visual snapshots in your UI tests. All clients share one build per test run,
/// which the SDK creates on the first check.
///
/// The build belongs to the first client's region, credentials, and build options. Later clients must use
/// the same ones, and then share the first client's connection. A client with a different configuration
/// throws `VisualError.conflictingConfiguration`.
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
    private let device: DeviceInfo

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
        // Usually already done when the SDK loads; this is a fallback.
        TestObservation.register()
    }

    internal init(
        credentials: VisualCredentials?,
        region: SauceRegion?,
        options: VisualBuildOptions,
        session: URLSession,
        environment: [String: String],
        store: SharedBuildStore,
        uploader: PresignedUploader = .shared
    ) throws {
        let credentials = try credentials ?? VisualCredentials.fromEnvironment(environment)
        let region = try region ?? SauceRegion.fromEnvironment(environment)
        let options = options.resolved(with: environment)
        if let buildId = options.buildId, UUID(uuidString: buildId) == nil { throw VisualError.invalidBuildId }
        self.region = region
        self.options = options
        self.configuration = BuildConfiguration(endpoint: region.graphqlEndpoint, credentials: credentials, options: options)
        self.api = VisualAPI(region: region, credentials: credentials, session: session, uploader: uploader)
        self.store = store
        self.device = DeviceInfo.current(environment)
    }

    /// The shared build, created if needed. Only useful to read its ID or link before the first check.
    /// Concurrent first calls make one request, and a failed attempt is retried by the next call.
    /// - Throws: `VisualError.buildAlreadyCompleted` after `finish()`, `.conflictingConfiguration`,
    ///   `.invalidBuildId`, `.buildNotFound`, or `VisualAPIError`.
    public func build() async throws -> VisualBuild {
        try await store.run(configuration, api: api).build
    }

    /// Screenshots the screen and uploads it as snapshot `name`, named after the running test.
    /// - Throws: `VisualError`, such as `.elementNotFound`, `.clipElementOffScreen`, or `.conflictingConfiguration`,
    ///   or `VisualAPIError`.
    @MainActor
    @discardableResult
    public func sauceVisualCheck(
        _ name: String, options: VisualCheckOptions = VisualCheckOptions()
    ) async throws -> VisualSnapshot {
        let prepared = try SnapshotCapture.prepare(name, options: options)
        return try await check(name: prepared.name, png: prepared.png, request: prepared.request)
    }

    /// Uploads a prepared snapshot to the shared build. `name` is already validated by `SnapshotCapture`.
    /// The upload goes through the API of the client that owns the build, so it reaches that build's
    /// account and region.
    internal func check(name: String, png: Data, request: SnapshotRequest = SnapshotRequest()) async throws -> VisualSnapshot {
        // Crop here rather than on the main actor, so the test isn't blocked while the image is re-encoded.
        let png = try request.clip.map { try Screenshot.crop(png, to: $0) } ?? png
        let device = self.device
        // Admitted for the whole upload, so finishing waits until the snapshot is created or has failed.
        return try await store.check(configuration, api: api) { run in
            try await run.api.createSnapshot(name: name, png: png, device: device, request: request, in: run.build)
        }
    }

    /// Finishes the build early. You don't need to call this for a build the SDK finishes automatically.
    /// New checks are refused from the moment it's called; checks already running are waited for.
    /// Repeated calls return the same result without another request.
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
    /// Set when finishing starts. Later checks are refused; already admitted ones may still complete.
    private(set) var isClosed = false
    /// Admitted checks that haven't ended yet, and the finish calls waiting for them.
    private var activeChecks = 0
    private var drainWaiters: [CheckedContinuation<Void, Never>] = []

    func run(_ configuration: BuildConfiguration, api: VisualAPI) async throws -> Run {
        let api = try ownerAPI(for: configuration, api)
        if isClosed { throw VisualError.buildAlreadyCompleted }
        return Run(build: try await resolve(configuration.options, with: api).build, api: api)
    }

    /// Runs `body` with the build as one admitted check. Finishing waits until it ends, whether it
    /// succeeds or fails. A check admitted while the build is still being created may still complete.
    func check<T: Sendable>(
        _ configuration: BuildConfiguration, api: VisualAPI, _ body: @Sendable (Run) async throws -> T
    ) async throws -> T {
        let api = try ownerAPI(for: configuration, api)
        if isClosed { throw VisualError.buildAlreadyCompleted }
        // Admitted before the first suspension, so a finish that starts meanwhile waits for it.
        activeChecks += 1
        defer { endCheck() }
        let build = try await resolve(configuration.options, with: api).build
        return try await body(Run(build: build, api: api))
    }

    func finish(_ configuration: BuildConfiguration, api: VisualAPI) async throws -> VisualBuild {
        let api = try ownerAPI(for: configuration, api)
        // Closed before the first suspension, so no check is admitted after finishing starts.
        isClosed = true
        if let finishing { return try await finishing.value }
        let build = try await resolve(configuration.options, with: api).build
        await drainChecks()
        return try await finish(build, with: api)
    }

    /// Called when the test bundle ends. Finishes the build only if this worker owns finishing it, which is
    /// not the same as having created it: a build named by `buildId` or `customId` may still have other
    /// workers uploading, so it is left open for the step that knows they are all done.
    /// See `VisualAPI.Resolution.ownsFinish`.
    func finishOwnedBuild() async -> AutoFinish.Outcome {
        guard let pending, let owner else { return .noBuild }
        isClosed = true
        do {
            let resolution = try await pending.value
            guard resolution.ownsFinish else { return .leftOpen(resolution.build) }
            await drainChecks()
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

    private func endCheck() {
        activeChecks -= 1
        guard activeChecks == 0 else { return }
        let waiters = drainWaiters
        drainWaiters = []
        waiters.forEach { $0.resume() }
    }

    /// Waits until every admitted check has ended.
    private func drainChecks() async {
        while activeChecks > 0 {
            await withCheckedContinuation { drainWaiters.append($0) }
        }
    }

    private func finish(_ build: VisualBuild, with api: VisualAPI) async throws -> VisualBuild {
        // Another call may have started finishing meanwhile.
        if let finishing { return try await finishing.value }
        let task = Task { try await api.finishBuild(build) }
        finishing = task
        do {
            return try await task.value
        } catch {
            // Let a later call retry, for example after a network error.
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
