import Foundation
import XCTest

/// A snapshot added to the build. Its comparison result appears in the Sauce Visual dashboard.
public struct VisualSnapshot: Hashable, Sendable {
    public let id: String
    public let name: String
    public let buildId: String
    public let testName: String?
    public let suiteName: String?

    public init(id: String, name: String, buildId: String, testName: String? = nil, suiteName: String? = nil) {
        self.id = id
        self.name = name
        self.buildId = buildId
        self.testName = testName
        self.suiteName = suiteName
    }
}

/// The test and suite names sent with a snapshot, used to group snapshots in the dashboard.
internal struct TestIdentity: Hashable, Sendable {
    let testName: String?
    let suiteName: String?

    init(testName: String? = nil, suiteName: String? = nil) {
        self.testName = Self.clean(testName)
        self.suiteName = Self.clean(suiteName)
    }

    /// The suite is the test's class, the test is its method.
    init(_ testCase: XCTestCase) {
        self.init(testName: Self.method(from: testCase.name), suiteName: String(describing: type(of: testCase)))
    }

    /// Names you pass win; blank ones are ignored.
    func overriding(testName: String?, suiteName: String?) -> TestIdentity {
        TestIdentity(testName: Self.clean(testName) ?? self.testName, suiteName: Self.clean(suiteName) ?? self.suiteName)
    }

    /// Turns XCTest's `-[Class method]` into `method`.
    static func method(from name: String) -> String {
        guard name.hasPrefix("-["), name.hasSuffix("]"), let space = name.lastIndex(of: " ") else { return name }
        return String(name[name.index(after: space)..<name.index(before: name.endIndex)])
    }

    private static func clean(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }
}

/// Device details sent with every snapshot. Baselines are matched per device and OS version.
internal struct DeviceInfo: Hashable, Sendable {
    /// `IOS`, `MACOS`, or `UNKNOWN` on tvOS, which the API doesn't list.
    let operatingSystem: String
    let operatingSystemVersion: String
    let device: String?

    static func current(_ environment: [String: String] = ProcessInfo.processInfo.environment) -> DeviceInfo {
        let version = ProcessInfo.processInfo.operatingSystemVersion
        var versionString = "\(version.majorVersion).\(version.minorVersion)"
        if version.patchVersion != 0 { versionString += ".\(version.patchVersion)" }
        return DeviceInfo(operatingSystem: operatingSystem, operatingSystemVersion: versionString, device: device(environment))
    }

    private static var operatingSystem: String {
        #if os(macOS)
        return "MACOS"
        #elseif os(iOS)
        return "IOS"
        #else
        return "UNKNOWN"
        #endif
    }

    /// The simulator's name, such as `iPhone 17`, or on a real device its model, such as `iPhone15,2`.
    private static func device(_ environment: [String: String]) -> String? {
        for key in ["SIMULATOR_DEVICE_NAME", "SIMULATOR_MODEL_IDENTIFIER"] {
            if let value = environment[key], !value.isEmpty { return value }
        }
        #if os(macOS)
        return sysctlString("hw.model")
        #else
        return sysctlString("hw.machine")
        #endif
    }

    private static func sysctlString(_ name: String) -> String? {
        var size = 0
        guard sysctlbyname(name, nil, &size, nil, 0) == 0, size > 0 else { return nil }
        var buffer = [CChar](repeating: 0, count: size)
        guard sysctlbyname(name, &buffer, &size, nil, 0) == 0 else { return nil }
        let value = String(cString: buffer)
        return value.isEmpty ? nil : value
    }
}

internal enum Screenshot {
    struct Capture: Sendable {
        let png: Data
        /// Pixels per point, for example 3 on most iPhones.
        let scale: CGFloat
        let pixelSize: CGSize
    }

    /// Screenshots the whole screen. XCUI only allows this on the main actor.
    @MainActor
    static func capture() -> Capture {
        let screenshot = XCUIScreen.main.screenshot()
        return capture(png: screenshot.pngRepresentation, pointWidth: screenshot.image.size.width)
    }

    /// Reads the image size from the PNG header, which works the same on every platform.
    static func capture(png: Data, pointWidth: CGFloat) -> Capture {
        let bytes = [UInt8](png.prefix(24))
        guard bytes.count == 24 else { return Capture(png: png, scale: 1, pixelSize: .zero) }
        func number(at offset: Int) -> Int { bytes[offset..<offset + 4].reduce(0) { $0 << 8 | Int($1) } }
        let size = CGSize(width: number(at: 16), height: number(at: 20))
        let scale = pointWidth > 0 ? size.width / pointWidth : 1
        return Capture(png: png, scale: scale, pixelSize: size)
    }
}
