import Foundation

/// Takes Sauce Visual snapshots in your UI tests. All clients share one build per test run,
/// which the SDK creates on the first check and finishes when the tests end.
public actor VisualClient {
    public nonisolated let region: SauceRegion
    public nonisolated let options: VisualBuildOptions
    private let api: VisualAPI
    private let store: SharedBuildStore
    private let device: DeviceInfo

    /// Anything you leave out is read from `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`, `SAUCE_REGION`, and `SAUCE_VISUAL_*`.
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
        self.device = DeviceInfo.current(environment)
    }

    /// The shared build, created if needed. Only useful to read its ID or link before the first check.
    /// - Throws: `VisualError.buildAlreadyCompleted` after `finish()`, `.invalidBuildId`, or `VisualAPIError`.
    public func build() async throws -> VisualBuild {
        try await store.build(api: api, options: options)
    }

    /// Screenshots the screen and uploads it as snapshot `name`, named after the running test.
    /// - Throws: `VisualError.invalidSnapshotName`, `.elementNotFound`, `.buildAlreadyCompleted`, or `VisualAPIError`.
    @MainActor
    @discardableResult
    public func sauceVisualCheck(
        _ name: String, options: VisualCheckOptions = VisualCheckOptions()
    ) async throws -> VisualSnapshot {
        let name = try Self.snapshotName(name)
        // Screenshot first, so it shows the screen as it was when you called the check.
        let screenshot = Screenshot.capture()
        let request = try options.resolve(running: CurrentTest.shared.identity, screenshot: screenshot)
        return try await check(name: name, png: screenshot.png, request: request)
    }

    internal func check(name: String, png: Data, request: SnapshotRequest = SnapshotRequest()) async throws -> VisualSnapshot {
        let name = try Self.snapshotName(name)
        let build = try await build()
        return try await api.createSnapshot(name: name, png: png, device: device, request: request, in: build)
    }

    private static func snapshotName(_ name: String) throws -> String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw VisualError.invalidSnapshotName }
        return trimmed
    }

    /// Finishes the build early. You don't need to call this: the SDK finishes it when the tests end.
    /// - Throws: `VisualAPIError`, or any error from creating the build.
    public func finish() async throws -> VisualBuild {
        try await store.finish(api: api, options: options)
    }
}

internal actor SharedBuildStore {
    static let shared = SharedBuildStore()

    private var pending: Task<VisualAPI.Resolution, Error>?
    /// The client that created or found the build, used to finish it at the end.
    private var owner: VisualAPI?
    private var finishing: Task<VisualBuild, Error>?

    func build(api: VisualAPI, options: VisualBuildOptions) async throws -> VisualBuild {
        if finishing != nil { throw VisualError.buildAlreadyCompleted }
        return try await resolve(api: api, options: options).build
    }

    func finish(api: VisualAPI, options: VisualBuildOptions) async throws -> VisualBuild {
        if let finishing { return try await finishing.value }
        let build = try await resolve(api: api, options: options).build
        return try await finish(build, with: api)
    }

    /// Runs when the tests end. Builds reused through `buildId` or `customId` are left open.
    func finishCreatedBuild() async -> AutoFinish.Outcome {
        guard let pending, let owner else { return .noBuild }
        do {
            let resolution = try await pending.value
            guard resolution.created else { return .leftOpen(resolution.build) }
            return .finished(try await finish(resolution.build, with: owner))
        } catch {
            return .failed(error)
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

    /// Runs in its own task, so cancelling one caller doesn't fail the others waiting for the build.
    private func resolve(api: VisualAPI, options: VisualBuildOptions) async throws -> VisualAPI.Resolution {
        if let pending { return try await pending.value }
        let task = Task { try await api.resolveBuild(options) }
        pending = task
        owner = api
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
