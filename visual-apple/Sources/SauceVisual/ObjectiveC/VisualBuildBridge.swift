#if canImport(ObjectiveC)
import Foundation
import XCTest

/// A Sauce Labs data center, for Objective-C.
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

/// Build details for Objective-C. Anything `nil` is read from its `SAUCE_VISUAL_*` environment variable.
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

    /// Reads every value from the environment.
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

/// A Sauce Visual build, for Objective-C.
@objc(SLVBuild)
public final class VisualBuildRecord: NSObject, Sendable {
    /// The build's ID. Not called `id`, which Objective-C reserves.
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

/// A Sauce Visual snapshot, for Objective-C.
@objc(SLVSnapshot)
public final class VisualSnapshotRecord: NSObject, Sendable {
    /// The snapshot's ID. Not called `id`, which Objective-C reserves.
    @objc public let snapshotId: String
    @objc public let name: String
    @objc public let buildId: String
    @objc public let testName: String?
    @objc public let suiteName: String?

    internal init(_ value: VisualSnapshot) {
        snapshotId = value.id
        name = value.name
        buildId = value.buildId
        testName = value.testName
        suiteName = value.suiteName
        super.init()
    }
}

/// How screenshots are compared. `Balanced` is the default.
@objc(SLVDiffingMethod)
public enum VisualDiffingMethodCode: Int, Sendable {
    case balanced = 0
    case simple = 1
    case experimental = 2

    internal var value: DiffingMethod {
        switch self {
        case .balanced: return .balanced
        case .simple: return .simple
        case .experimental: return .experimental
        }
    }
}

/// Operating systems for a baseline override, for Objective-C. `NotSet` keeps the snapshot's own.
@objc(SLVOperatingSystem)
public enum VisualOperatingSystemCode: Int, Sendable {
    case notSet = 0
    case ios = 1
    case macos = 2
    case android = 3
    case windows = 4
    case linux = 5
    case unknown = 6

    internal var value: OperatingSystem? {
        switch self {
        case .notSet: return nil
        case .ios: return .ios
        case .macos: return .macos
        case .android: return .android
        case .windows: return .windows
        case .linux: return .linux
        case .unknown: return .unknown
        }
    }

    internal init(_ value: OperatingSystem?) {
        switch value {
        case nil: self = .notSet
        case .ios: self = .ios
        case .macos: self = .macos
        case .android: self = .android
        case .windows: self = .windows
        case .linux: self = .linux
        case .unknown: self = .unknown
        }
    }
}

/// Values used instead of the snapshot's own when looking up its baseline, for Objective-C.
/// Properties left `nil` keep the snapshot's own value.
@objc(SLVBaselineOverride)
public final class VisualBaselineOverride: NSObject, @unchecked Sendable {
    @objc public var name: String?
    @objc public var testName: String?
    @objc public var suiteName: String?
    @objc public var device: String?
    @objc public var operatingSystem: VisualOperatingSystemCode = .notSet
    @objc public var operatingSystemVersion: String?

    @objc public override init() {
        super.init()
    }

    internal convenience init(_ value: BaselineOverride) {
        self.init()
        name = value.name
        testName = value.testName
        suiteName = value.suiteName
        device = value.device
        operatingSystem = VisualOperatingSystemCode(value.operatingSystem)
        operatingSystemVersion = value.operatingSystemVersion
    }

    internal var value: BaselineOverride {
        BaselineOverride(
            name: name, testName: testName, suiteName: suiteName, device: device,
            operatingSystem: operatingSystem.value, operatingSystemVersion: operatingSystemVersion
        )
    }
}

/// Options for one check, for Objective-C. Don't change them while the check runs.
@objc(SLVCheckOptions)
public final class VisualCheckConfiguration: NSObject, @unchecked Sendable {
    /// Defaults to the running test's method name.
    @objc public var testName: String?
    /// Defaults to the running test's class name.
    @objc public var suiteName: String?
    /// Snapshot only this element instead of the whole screen. Only its on-screen part is kept.
    @objc public var clipElement: XCUIElement?
    /// Areas to leave out of the comparison, as `CGRect` values in points.
    @objc public var ignoreRegions: [NSValue] = []
    /// Elements to leave out of the comparison. Each must exist when the check runs.
    @objc public var ignoreElements: [XCUIElement] = []
    @objc public var diffingMethod: VisualDiffingMethodCode = .balanced
    /// Compare against another snapshot's baseline.
    @objc public var baselineOverride: VisualBaselineOverride?

    internal var value: VisualCheckOptions {
        VisualCheckOptions(
            testName: testName,
            suiteName: suiteName,
            clipElement: clipElement,
            ignoreRegions: ignoreRegions.map { value in
                #if os(macOS)
                return value.rectValue
                #else
                return value.cgRectValue
                #endif
            },
            ignoreElements: ignoreElements,
            diffingMethod: diffingMethod.value,
            baselineOverride: baselineOverride?.value
        )
    }
}

/// Carries options to the main actor, where the check reads the elements.
private struct MainActorOptions: @unchecked Sendable {
    let value: VisualCheckOptions
}

/// Takes Sauce Visual snapshots from Objective-C. Call it from any thread;
/// each completion runs once on the main thread, with either a result or an error.
@objc(SLVClient)
public final class VisualObjCClient: NSObject, Sendable {
    private let client: VisualClient

    @objc public static var errorDomain: String { VisualError.errorDomain }
    @objc public var region: VisualRegion { VisualRegion(client.region) }
    @objc public var options: VisualBuildConfiguration { VisualBuildConfiguration(client.options) }
    /// Used for every check that doesn't set its own. A copy: changing it has no effect.
    @objc public var baselineOverride: VisualBaselineOverride? { client.baselineOverride.map(VisualBaselineOverride.init) }

    /// Anything `nil` is read from `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`, `SAUCE_REGION`, and `SAUCE_VISUAL_*`.
    /// `baselineOverride` applies to every check that doesn't set its own.
    /// - Throws: `SLVErrorCodeInvalidCredentials`, `SLVErrorCodeUnknownRegion`, or `SLVErrorCodeInvalidBuildId`.
    @objc(initWithUsername:accessKey:region:options:baselineOverride:error:)
    public init(
        username: String?, accessKey: String?, region: VisualRegion?, options: VisualBuildConfiguration?,
        baselineOverride: VisualBaselineOverride?
    ) throws {
        let credentials: VisualCredentials?
        if username == nil && accessKey == nil {
            credentials = nil
        } else {
            credentials = try VisualCredentials(username: username ?? "", accessKey: accessKey ?? "")
        }
        client = try VisualClient(
            credentials: credentials, region: region?.value, options: options?.value ?? VisualBuildOptions(),
            baselineOverride: baselineOverride?.value
        )
        super.init()
    }

    /// Like `initWithUsername:accessKey:region:options:baselineOverride:error:`, without a baseline override.
    @objc(initWithUsername:accessKey:region:options:error:)
    public convenience init(
        username: String?, accessKey: String?, region: VisualRegion?, options: VisualBuildConfiguration?
    ) throws {
        try self.init(username: username, accessKey: accessKey, region: region, options: options, baselineOverride: nil)
    }

    /// Reads credentials and region from the environment.
    @objc(initWithOptions:error:)
    public convenience init(options: VisualBuildConfiguration?) throws {
        try self.init(username: nil, accessKey: nil, region: nil, options: options)
    }

    /// The shared build, created if needed.
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

    /// Screenshots the screen and uploads it as snapshot `name`, named after the running test.
    @objc(sauceVisualCheckWithName:completion:)
    public func sauceVisualCheck(
        name: String, completion: @escaping @MainActor @Sendable (VisualSnapshotRecord?, NSError?) -> Void
    ) {
        sauceVisualCheck(name: name, options: nil, completion: completion)
    }

    /// Like `sauceVisualCheckWithName:completion:`, with options such as areas to ignore.
    @objc(sauceVisualCheckWithName:options:completion:)
    public func sauceVisualCheck(
        name: String, options: VisualCheckConfiguration?,
        completion: @escaping @MainActor @Sendable (VisualSnapshotRecord?, NSError?) -> Void
    ) {
        let client = self.client
        // Read the test's names now, while it is certainly still running.
        var value = options?.value ?? VisualCheckOptions()
        let test = CurrentTest.shared.identity.overriding(testName: value.testName, suiteName: value.suiteName)
        value.testName = test.testName
        value.suiteName = test.suiteName
        let request = MainActorOptions(value: value)
        Task { @MainActor in
            do {
                let snapshot = try await client.sauceVisualCheck(name, options: request.value)
                completion(VisualSnapshotRecord(snapshot), nil)
            } catch {
                completion(nil, bridgeToNSError(error))
            }
        }
    }

    /// Finishes the build early. You don't need to: the SDK finishes it when the tests end.
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
