#if canImport(ObjectiveC)
import Foundation

/// Objective-C representation of a `SauceRegion`.
@objc(SLVRegion)
public final class VisualRegion: NSObject, Sendable {
    internal let value: SauceRegion

    @objc public var name: String { value.name }
    @objc public var aliases: [String] { value.aliases }
    @objc public var graphqlEndpoint: URL { value.graphqlEndpoint }

    internal init(_ value: SauceRegion) {
        self.value = value
        super.init()
    }

    @objc(initWithName:graphqlEndpoint:)
    public convenience init(name: String, graphqlEndpoint: URL) {
        self.init(SauceRegion(name: name, graphqlEndpoint: graphqlEndpoint))
    }

    @objc public static var usWest1: VisualRegion { VisualRegion(.usWest1) }
    @objc public static var usEast4: VisualRegion { VisualRegion(.usEast4) }
    @objc public static var euCentral1: VisualRegion { VisualRegion(.euCentral1) }
    @objc public static var staging: VisualRegion { VisualRegion(.staging) }
    /// `us-west-1`.
    @objc public static var defaultRegion: VisualRegion { VisualRegion(.default) }

    /// Looks up a region by name or alias. An empty name returns `defaultRegion`.
    @objc(regionNamed:error:)
    public static func named(_ name: String) throws -> VisualRegion {
        VisualRegion(try SauceRegion.named(name))
    }

    public override func isEqual(_ object: Any?) -> Bool { (object as? VisualRegion)?.value == value }
    public override var hash: Int { value.hashValue }
}

/// Objective-C build attributes. `nil` fields fall back to their `SAUCE_VISUAL_*` environment variable.
@objc(SLVBuildOptions)
public final class VisualBuildConfiguration: NSObject, Sendable {
    internal let value: VisualBuildOptions

    @objc public var name: String? { value.name }
    @objc public var project: String? { value.project }
    @objc public var branch: String? { value.branch }
    @objc public var defaultBranch: String? { value.defaultBranch }
    @objc public var customId: String? { value.customId }
    @objc public var buildId: String? { value.buildId }

    internal init(_ value: VisualBuildOptions) {
        self.value = value
        super.init()
    }

    /// Every attribute from the environment.
    @objc public override convenience init() {
        self.init(VisualBuildOptions())
    }

    @objc(initWithName:project:branch:defaultBranch:customId:buildId:)
    public convenience init(
        name: String?, project: String?, branch: String?, defaultBranch: String?, customId: String?, buildId: String?
    ) {
        self.init(VisualBuildOptions(
            name: name, project: project, branch: branch, defaultBranch: defaultBranch, customId: customId, buildId: buildId
        ))
    }
}

/// Objective-C representation of a Sauce Visual build.
@objc(SLVBuild)
public final class VisualBuildRecord: NSObject, Sendable {
    /// Build UUID. Named `buildId` because `id` is reserved in Objective-C.
    @objc public let buildId: String
    @objc public let name: String?
    @objc public let project: String?
    @objc public let branch: String?
    @objc public let defaultBranch: String?
    @objc public let status: String?
    @objc public let url: String?
    @objc public let customId: String?

    internal init(_ value: VisualBuild) {
        buildId = value.id
        name = value.name
        project = value.project
        branch = value.branch
        defaultBranch = value.defaultBranch
        status = value.status
        url = value.url
        customId = value.customId
        super.init()
    }
}

/// Objective-C facade over `VisualClient`. Every client in the process shares one build.
///
/// Entry points may be called from any thread. Completion is invoked once on MainActor, never inline,
/// with either a build or an NSError, never both. The shared request is not cancellable, because
/// other clients may be waiting for it.
@objc(SLVClient)
public final class VisualObjCClient: NSObject, Sendable {
    private let client: VisualClient

    @objc public static var errorDomain: String { VisualError.errorDomain }
    @objc public var region: VisualRegion { VisualRegion(client.region) }
    @objc public var options: VisualBuildConfiguration { VisualBuildConfiguration(client.options) }

    /// `nil` arguments come from `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`, `SAUCE_REGION`, and `SAUCE_VISUAL_*`.
    /// - Throws: `SLVErrorCodeInvalidCredentials`, `SLVErrorCodeUnknownRegion`, or `SLVErrorCodeInvalidBuildId`.
    @objc(initWithUsername:accessKey:region:options:error:)
    public init(
        username: String?, accessKey: String?, region: VisualRegion?, options: VisualBuildConfiguration?
    ) throws {
        let credentials: VisualCredentials?
        if username == nil && accessKey == nil {
            credentials = nil
        } else {
            credentials = try VisualCredentials(username: username ?? "", accessKey: accessKey ?? "")
        }
        client = try VisualClient(
            credentials: credentials, region: region?.value, options: options?.value ?? VisualBuildOptions()
        )
        super.init()
    }

    /// Everything from the environment.
    @objc(initWithOptions:error:)
    public convenience init(options: VisualBuildConfiguration?) throws {
        try self.init(username: nil, accessKey: nil, region: nil, options: options)
    }

    /// Creates or reuses the shared build.
    @objc(buildWithCompletion:)
    public func build(completion: @escaping @MainActor @Sendable (VisualBuildRecord?, NSError?) -> Void) {
        let client = self.client
        Task {
            do {
                let build = try await client.build()
                await completion(VisualBuildRecord(build), nil)
            } catch {
                await completion(nil, bridgeToNSError(error))
            }
        }
    }

    /// Finishes the shared build. Repeated calls return the same build.
    @objc(finishWithCompletion:)
    public func finish(completion: @escaping @MainActor @Sendable (VisualBuildRecord?, NSError?) -> Void) {
        let client = self.client
        Task {
            do {
                let build = try await client.finish()
                await completion(VisualBuildRecord(build), nil)
            } catch {
                await completion(nil, bridgeToNSError(error))
            }
        }
    }
}

internal func bridgeToNSError(_ error: Error) -> NSError {
    if error is CancellationError { return VisualError.cancelled as NSError }
    return error as NSError
}
#endif
