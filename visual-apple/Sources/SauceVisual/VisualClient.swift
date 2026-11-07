import Foundation

/// XCUITest snapshot submission. One configuration owns the default build in each test process.
/// Await every check. A receipt confirms submission, not baseline equality.
public actor VisualClient {
    public nonisolated let region: SauceRegion
    public nonisolated let options: VisualBuildOptions
    public nonisolated let baselineOverride: BaselineOverride?
    private let configuration: BuildConfiguration
    private let api: VisualAPI
    private let store: SharedBuildStore
    private let device: DeviceInfo

    public init(
        credentials: VisualCredentials? = nil,
        region: SauceRegion? = nil,
        options: VisualBuildOptions = VisualBuildOptions(),
        baselineOverride: BaselineOverride? = nil,
        session: URLSession? = nil
    ) throws {
        try self.init(
            credentials: credentials, region: region, options: options, baselineOverride: baselineOverride,
            session: session ?? GraphQLTransport.defaultSession, environment: ProcessInfo.processInfo.environment, store: .shared
        )
        TestObservation.register()
    }

    internal init(
        credentials: VisualCredentials?, region: SauceRegion?, options: VisualBuildOptions,
        baselineOverride: BaselineOverride? = nil, session: URLSession,
        environment: [String: String], store: SharedBuildStore, uploader: PresignedUploader = .shared
    ) throws {
        let credentials = try credentials ?? VisualCredentials.fromEnvironment(environment)
        let region = try region ?? SauceRegion.fromEnvironment(environment)
        var options = options.resolved(with: environment)
        if let buildId = options.buildId {
            guard let uuid = UUID(uuidString: buildId) else { throw VisualError.invalidBuildId }
            options.buildId = uuid.uuidString.lowercased()
        }
        try options.validateFinishDelay()
        self.region = region
        self.options = options
        self.baselineOverride = baselineOverride
        self.configuration = BuildConfiguration(endpoint: region.graphqlEndpoint, credentials: credentials, options: options)
        self.api = VisualAPI(region: region, credentials: credentials, session: session, uploader: uploader)
        self.store = store
        self.device = DeviceInfo.current(environment)
    }

    /// Resolve the run's build. Uncertain creation is reconciled by custom ID, never blindly repeated.
    public func build() async throws -> VisualBuild {
        try await store.run(configuration, api: api).build
    }

    /// Captures and submits one snapshot. The operation is admitted before any screenshot or gesture.
    /// Requested DOM is required; unavailable DOM does not silently downgrade the check.
    @MainActor
    @discardableResult
    public func sauceVisualCheck(
        _ name: String, options: VisualCheckOptions = VisualCheckOptions()
    ) async throws -> VisualSnapshot {
        try Task.checkCancellation()
        _ = try SnapshotCapture.validName(name)
        try options.validate()
        let admission = try await store.admit(configuration, api: api)
        do {
            // Serialize capture across all clients, including suspension while scrolling settles.
            // Networking does not hold this gate. XCUI handles never leave MainActor here.
            let result = try await CaptureGate.submissions.withCapture {
                let rendered = try await captureAndRender(name, options: options)
                return try await submit(rendered, admission: admission)
            }
            await store.release(admission)
            return result
        } catch {
            await store.release(admission)
            throw error
        }
    }

    /// Internal entry point for already prepared requests and deterministic transport tests.
    internal func check(
        name: String, png: Data, request: SnapshotRequest = SnapshotRequest()
    ) async throws -> VisualSnapshot {
        try Task.checkCancellation()
        let name = try SnapshotCapture.validName(name)
        try request.validate()
        let admission = try await store.admit(configuration, api: api)
        do {
            let prepared = SnapshotCapture.Prepared(name: name, png: png, request: request)
            let rendered = try render(prepared)
            let result = try await submit(rendered, admission: admission)
            await store.release(admission)
            return result
        } catch {
            await store.release(admission)
            throw error
        }
    }

    private struct Rendered: Sendable {
        let name: String
        let image: Data
        let request: SnapshotRequest
    }

    @MainActor
    private func captureAndRender(_ name: String, options: VisualCheckOptions) async throws -> Rendered {
        try await CaptureGate.shared.withCapture {
            let prepared = try await SnapshotCapture.prepare(name, options: options)
            // This scope, including all captured frames, ends before submission awaits networking.
            return try await render(prepared)
        }
    }

    /// CPU rendering uses this actor, never MainActor. No XCUI handles reach this method.
    private func render(_ prepared: SnapshotCapture.Prepared) throws -> Rendered {
        try Task.checkCancellation()
        var request = prepared.request
        try request.validate()
        let image: Data
        if let frames = request.fullPage, let clip = request.clip {
            image = try FullPageCapture.stitch(
                first: prepared.png, frames: frames, clip: clip,
                maxOutputPixels: request.maxOutputPixels
            )
        } else {
            image = try request.clip.map { try Screenshot.crop(prepared.png, to: $0) } ?? prepared.png
        }
        request.fullPage = nil
        request.baselineOverride = request.baselineOverride ?? baselineOverride
        let size = Screenshot.capture(png: image, pointWidth: 0).pixelSize
        request.pixelWidth = Int(exactly: size.width) ?? 0
        request.pixelHeight = Int(exactly: size.height) ?? 0
        try Task.checkCancellation()
        return Rendered(name: prepared.name, image: image, request: request)
    }

    private func submit(_ rendered: Rendered, admission: SharedBuildStore.Admission) async throws -> VisualSnapshot {
        try Task.checkCancellation()
        let run = try await store.resolve(admission)
        return try await run.api.createSnapshot(
            name: rendered.name, png: rendered.image, device: device, request: rendered.request, in: run.build
        )
    }

    /// Close admission, drain accepted captures/submissions, and finalize the remote build.
    /// With finishDelay this schedules finalization; it does not wait for comparison completion.
    public func finish() async throws -> VisualBuild {
        try await store.finish(configuration, api: api)
    }
}

internal struct BuildConfiguration: Hashable, Sendable {
    let endpoint: URL
    let credentials: VisualCredentials
    let options: VisualBuildOptions
}

/// Owns admission, configuration, remote creation, and finalization. No UI objects cross this actor.
internal actor SharedBuildStore {
    static let shared = SharedBuildStore()

    struct Run: Sendable {
        let build: VisualBuild
        let api: VisualAPI
    }

    /// Opaque local lease: only this store can create one, and every caller must release it.
    struct Admission: Hashable, Sendable {
        fileprivate let id: UUID
    }

    private var owner: (configuration: BuildConfiguration, api: VisualAPI)?
    private var pending: Task<VisualAPI.Resolution, Error>?
    private var uncertainCreation: Error?
    private var creationDefinitelyFailed = false
    private var finishing: Task<VisualBuild, Error>?
    private var finishMayHaveBeenApplied = false
    private var lastFinishError: Error?
    private(set) var isClosed = false
    private var admissions: Set<UUID> = []
    private var drainWaiters: [CheckedContinuation<Void, Never>] = []

    /// Validation and admission occur without suspension. A rejected call never binds configuration.
    func admit(_ configuration: BuildConfiguration, api: VisualAPI) throws -> Admission {
        try Task.checkCancellation()
        guard !isClosed else { throw VisualError.buildAlreadyCompleted }
        _ = try ownerAPI(for: configuration, api)
        let admission = Admission(id: UUID())
        admissions.insert(admission.id)
        return admission
    }

    func resolve(_ admission: Admission) async throws -> Run {
        guard admissions.contains(admission.id), let owner else {
            throw VisualError.buildAlreadyCompleted
        }
        try Task.checkCancellation()
        let resolution = try await resolve(owner.configuration.options, with: owner.api)
        try Task.checkCancellation()
        return Run(build: resolution.build, api: owner.api)
    }

    /// Idempotent local release; callers await this in both success and failure paths.
    func release(_ admission: Admission) {
        guard admissions.remove(admission.id) != nil else { return }
        guard admissions.isEmpty else { return }
        // Rebinding after a definite failure is safe only when no accepted work still holds the owner.
        if creationDefinitelyFailed && pending == nil && uncertainCreation == nil && !isClosed {
            owner = nil
            creationDefinitelyFailed = false
        }
        let waiters = drainWaiters
        drainWaiters.removeAll(keepingCapacity: true)
        waiters.forEach { $0.resume() }
    }

    func run(_ configuration: BuildConfiguration, api: VisualAPI) async throws -> Run {
        let admission = try admit(configuration, api: api)
        do {
            let result = try await resolve(admission)
            release(admission)
            return result
        } catch {
            release(admission)
            throw error
        }
    }

    /// Kept for prepared-request tests and other internal callers. Do not nest a second lease inside it.
    func check<T: Sendable>(
        _ configuration: BuildConfiguration, api: VisualAPI,
        _ body: @Sendable (Run) async throws -> T
    ) async throws -> T {
        let admission = try admit(configuration, api: api)
        do {
            let run = try await resolve(admission)
            let result = try await body(run)
            release(admission)
            return result
        } catch {
            release(admission)
            throw error
        }
    }

    func finish(_ configuration: BuildConfiguration, api: VisualAPI) async throws -> VisualBuild {
        try Task.checkCancellation()
        let api = try ownerAPI(for: configuration, api)
        isClosed = true
        return try await finalization(options: configuration.options, api: api).value
    }

    /// Best-effort XCTest fallback. It drains even when capture has not created a remote build yet.
    func finishOwnedBuild() async -> AutoFinish.Outcome {
        guard let owner else { return .noBuild }
        isClosed = true
        await drainChecks()
        let delay = owner.configuration.options.finishDelaySeconds
        do {
            // Manual finalization takes precedence over automatic ownership/reporting rules.
            if let finishing {
                let build = try await finishing.value
                return delay.map { .finishDelayed(build, seconds: $0) } ?? .finished(build)
            }
            if let lastFinishError {
                return .failed(lastFinishError)
            }
            if let uncertainCreation { return .failed(uncertainCreation) }
            guard let pending else { return .noBuild }
            let resolution = try await pending.value
            guard resolution.ownsFinish || delay != nil else { return .leftOpen(resolution.build) }
            let build = try await finalization(options: owner.configuration.options, api: owner.api).value
            return delay.map { .finishDelayed(build, seconds: $0) } ?? .finished(build)
        } catch {
            return .failed(error)
        }
    }

    private func ownerAPI(for configuration: BuildConfiguration, _ api: VisualAPI) throws -> VisualAPI {
        guard let owner else {
            owner = (configuration, api)
            return api
        }
        guard owner.configuration == configuration else { throw VisualError.conflictingConfiguration }
        return owner.api
    }

    private func drainChecks() async {
        while !admissions.isEmpty {
            await withCheckedContinuation { drainWaiters.append($0) }
        }
    }

    /// The shared task owns all of finalization, including draining. One waiter's cancellation cannot
    /// stop finalization for the rest of the run. Failure never reopens admission.
    private func finalization(options: VisualBuildOptions, api: VisualAPI) -> Task<VisualBuild, Error> {
        if let finishing { return finishing }
        let task = Task { try await self.performFinalization(options: options, api: api) }
        finishing = task
        return task
    }

    private func performFinalization(options: VisualBuildOptions, api: VisualAPI) async throws -> VisualBuild {
        do {
            await drainChecks()
            let build = try await resolve(options, with: api).build
            let delay = options.finishDelaySeconds
            let result = try await (finishMayHaveBeenApplied
                ? api.reconcileFinish(build, delay: delay)
                : api.finishBuild(build, delay: delay))
            lastFinishError = nil
            return result
        } catch {
            // Publish recovery state before the shared task completes and wakes its waiters.
            if VisualAPI.mayHaveBeenApplied(error) { finishMayHaveBeenApplied = true }
            lastFinishError = error
            finishing = nil
            throw error
        }
    }

    private func resolve(_ options: VisualBuildOptions, with api: VisualAPI) async throws -> VisualAPI.Resolution {
        if let pending { return try await pending.value }
        if let uncertainCreation, options.customId == nil { throw uncertainCreation }
        let task = Task { try await self.performResolution(options: options, api: api) }
        pending = task
        return try await task.value
    }

    private func performResolution(options: VisualBuildOptions, api: VisualAPI) async throws -> VisualAPI.Resolution {
        do {
            let result: VisualAPI.Resolution
            if let uncertainCreation {
                guard let customId = options.customId,
                      let found = try await api.reconcileCreation(customId: customId) else {
                    throw uncertainCreation
                }
                result = found
            } else {
                result = try await api.resolveBuild(options)
            }
            uncertainCreation = nil
            creationDefinitelyFailed = false
            return result
        } catch let error as VisualAPI.UncertainCreation {
            pending = nil
            uncertainCreation = error.underlying
            creationDefinitelyFailed = false
            throw error.underlying
        } catch {
            pending = nil
            creationDefinitelyFailed = uncertainCreation == nil
            // Do not unbind while an admitted capture or a closing run still owns this configuration.
            throw error
        }
    }
}
