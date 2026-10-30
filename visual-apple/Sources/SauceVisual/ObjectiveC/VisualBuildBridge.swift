#if canImport(ObjectiveC)
import Foundation
import XCTest

/// A Sauce Labs data center, for Objective-C.
@objc(SLVRegion)
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
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
    @objc public static var asiaSouth2: VisualRegion { VisualRegion(.asiaSouth2) }
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
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
public final class VisualBuildConfiguration: NSObject, Sendable {
    internal let value: VisualBuildOptions

    @objc public var name: String? { value.name }
    @objc public var project: String? { value.project }
    @objc public var branch: String? { value.branch }
    @objc public var defaultBranch: String? { value.defaultBranch }
    @objc public var customId: String? { value.customId }
    @objc public var buildId: String? { value.buildId }
    /// Seconds, or `nil` for none. See `VisualBuildOptions.finishDelay`.
    @objc public var finishDelay: NSNumber? { value.finishDelay.map { NSNumber(value: $0) } }
    /// See `VisualBuildOptions.tags`.
    @objc public var tags: [String]? { value.tags }

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
        self.init(name: name, project: project, branch: branch, defaultBranch: defaultBranch, customId: customId,
                  buildId: buildId, finishDelay: nil)
    }

    /// `finishDelay` is in seconds and needs a `customId`. See `VisualBuildOptions.finishDelay`.
    @objc(initWithName:project:branch:defaultBranch:customId:buildId:finishDelay:)
    public convenience init(
        name: String?, project: String?, branch: String?, defaultBranch: String?, customId: String?, buildId: String?,
        finishDelay: NSNumber?
    ) {
        self.init(name: name, project: project, branch: branch, defaultBranch: defaultBranch, customId: customId,
                  buildId: buildId, finishDelay: finishDelay, tags: nil)
    }

    /// See `VisualBuildOptions.tags`.
    @objc(initWithName:project:branch:defaultBranch:customId:buildId:finishDelay:tags:)
    public convenience init(
        name: String?, project: String?, branch: String?, defaultBranch: String?, customId: String?, buildId: String?,
        finishDelay: NSNumber?, tags: [String]?
    ) {
        self.init(VisualBuildOptions(
            name: name, project: project, branch: branch, defaultBranch: defaultBranch, customId: customId, buildId: buildId,
            finishDelay: finishDelay?.doubleValue, tags: tags
        ))
    }
}

/// A Sauce Visual build, for Objective-C.
@objc(SLVBuild)
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
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
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
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
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
public enum VisualDiffingMethodCode: Int, Sendable {
    case balanced = 0
    // 1 was Simple, which isn't offered. The value isn't reused, so codes stay stable.
    case experimental = 2

    internal var value: DiffingMethod {
        switch self {
        case .balanced: return .balanced
        case .experimental: return .experimental
        }
    }
}

/// Operating systems for a baseline override, for Objective-C. `NotSet` keeps the snapshot's own.
@objc(SLVOperatingSystem)
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
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

/// Baseline override fields, for `-[SLVBaselineOverride matchNullFor:]`.
@objc(SLVBaselineOverrideField)
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
public enum VisualBaselineOverrideField: Int, Sendable {
    case name = 0
    case testName = 1
    case suiteName = 2
    case device = 3
    case operatingSystem = 4
    case operatingSystemVersion = 5
}

/// Values used instead of the snapshot's own when looking up its baseline, for Objective-C.
/// Properties left `nil` keep the snapshot's own value. Not thread-safe: one thread owns it, and must not
/// change it from another thread while a client or check is copying it. Later changes have no effect.
@objc(SLVBaselineOverride)
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
public final class VisualBaselineOverride: NSObject {
    @objc public var name: String?
    @objc public var testName: String?
    @objc public var suiteName: String?
    @objc public var device: String?
    @objc public var operatingSystem: VisualOperatingSystemCode = .notSet
    @objc public var operatingSystemVersion: String?
    /// Fields sent as `null`, matching baselines that have no value for them. Overrides any value set.
    private var nullFields = Set<VisualBaselineOverrideField>()

    @objc public override init() {
        super.init()
    }

    /// Sends `field` as `null`, matching baselines that have no value for it.
    @objc(matchNullFor:)
    public func matchNull(for field: VisualBaselineOverrideField) {
        nullFields.insert(field)
    }

    /// Whether `field` is sent as `null`.
    @objc(matchesNullFor:)
    public func matchesNull(for field: VisualBaselineOverrideField) -> Bool {
        nullFields.contains(field)
    }

    internal convenience init(_ value: BaselineOverride) {
        self.init()
        name = read(value.name, .name)
        testName = read(value.testName, .testName)
        suiteName = read(value.suiteName, .suiteName)
        device = read(value.device, .device)
        if case .value(let system)? = value.operatingSystem { operatingSystem = VisualOperatingSystemCode(system) }
        if case .null? = value.operatingSystem { nullFields.insert(.operatingSystem) }
        operatingSystemVersion = read(value.operatingSystemVersion, .operatingSystemVersion)
    }

    internal var value: BaselineOverride {
        BaselineOverride(
            name: field(name, .name),
            testName: field(testName, .testName),
            suiteName: field(suiteName, .suiteName),
            device: field(device, .device),
            operatingSystem: nullFields.contains(.operatingSystem) ? .null : operatingSystem.value.map { .value($0) },
            operatingSystemVersion: field(operatingSystemVersion, .operatingSystemVersion)
        )
    }

    private func field(_ value: String?, _ key: VisualBaselineOverrideField) -> BaselineValue<String>? {
        nullFields.contains(key) ? .null : value.map { .value($0) }
    }

    private func read(_ value: BaselineValue<String>?, _ key: VisualBaselineOverrideField) -> String? {
        switch value {
        case .value(let string)?: return string
        case .null?: nullFields.insert(key); return nil
        case nil: return nil
        }
    }
}

/// Options for one check, for Objective-C. Not thread-safe: one thread owns them, and must not change them
/// from another thread while the check call is copying them. Later changes have no effect.
@objc(SLVCheckOptions)
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
public final class VisualCheckConfiguration: NSObject {
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
    /// Upload the element tree of the app under test, or of `clipElement`. Off by default.
    @objc public var captureDom = false
    /// Scroll this element and snapshot all of its content. Not available on tvOS.
    @objc public var fullPageScrollElement: XCUIElement?
    /// The most screenshots to take for `fullPageScrollElement`.
    @objc public var fullPageScrollLimit: Int = 10
    /// Seconds to wait after each scroll.
    @objc public var fullPageDelayAfterScroll: TimeInterval = 0.5

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
            baselineOverride: baselineOverride?.value,
            captureDom: captureDom,
            fullPage: fullPageScrollElement.map {
                FullPageScreenshot(scrollElement: $0, scrollLimit: fullPageScrollLimit, delayAfterScroll: fullPageDelayAfterScroll)
            }
        )
    }
}

/// Carries options to the main actor, where the check reads the elements.
private struct MainActorOptions: @unchecked Sendable {
    let value: VisualCheckOptions
}

/// Takes Sauce Visual snapshots from Objective-C. Every client in the process shares one build and must use
/// the same region, credentials, and build options. Call it from any thread;
/// each completion runs once on the main thread, with either a result or an error.
@objc(SLVClient)
@available(swift, obsoleted: 1.0, message: "Objective-C only. Swift code uses the Swift types instead.")
public final class VisualObjCClient: NSObject, Sendable {
    private let client: VisualClient

    @objc public static var errorDomain: String { VisualError.errorDomain }
    @objc public var region: VisualRegion { VisualRegion(client.region) }
    @objc public var options: VisualBuildConfiguration { VisualBuildConfiguration(client.options) }
    /// Used for every check that doesn't set its own. A copy: changing it has no effect.
    @objc public var baselineOverride: VisualBaselineOverride? { client.baselineOverride.map(VisualBaselineOverride.init) }

    /// `nil` arguments come from `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`, `SAUCE_REGION`, and `SAUCE_VISUAL_*`.
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
