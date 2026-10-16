import Foundation
import ImageIO
import XCTest

/// Turns a `sauceVisualCheck` call into an upload: checks the name, takes the screenshot and resolves the options.
internal enum SnapshotCapture {
    /// Everything needed to upload one snapshot.
    struct Prepared: Sendable {
        let name: String
        let png: Data
        let request: SnapshotRequest
    }

    /// Runs on the main actor, because XCUI only allows screenshots and element frames there.
    /// - Throws: `VisualError.invalidSnapshotName`, `.elementNotFound`, or `.clipElementOffScreen`.
    @MainActor
    static func prepare(_ name: String, options: VisualCheckOptions) throws -> Prepared {
        let name = try validName(name)
        // Screenshot first, so it shows the screen as it was when the check was called.
        let screenshot = Screenshot.capture()
        let request = try options.resolve(running: CurrentTest.shared.identity, screenshot: screenshot)
        return Prepared(name: name, png: screenshot.png, request: request)
    }

    /// The name without surrounding whitespace.
    /// - Throws: `VisualError.invalidSnapshotName` when it's empty.
    static func validName(_ name: String) throws -> String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw VisualError.invalidSnapshotName }
        return trimmed
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
    /// `.unknown` on tvOS, which the API doesn't list.
    let operatingSystem: OperatingSystem
    let operatingSystemVersion: String
    let device: String?

    static func current(_ environment: [String: String] = ProcessInfo.processInfo.environment) -> DeviceInfo {
        let version = ProcessInfo.processInfo.operatingSystemVersion
        var versionString = "\(version.majorVersion).\(version.minorVersion)"
        if version.patchVersion != 0 { versionString += ".\(version.patchVersion)" }
        return DeviceInfo(operatingSystem: operatingSystem, operatingSystemVersion: versionString, device: device(environment))
    }

    private static var operatingSystem: OperatingSystem {
        #if os(macOS)
        return .macos
        #elseif os(iOS)
        return .ios
        #else
        return .unknown
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

    /// Cuts `rect`, in pixels, out of a PNG and returns it as a new PNG.
    /// - Throws: `VisualError.screenshotFailed` when the image can't be read or written.
    static func crop(_ png: Data, to rect: CGRect) throws -> Data {
        guard let source = CGImageSourceCreateWithData(png as CFData, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil),
              let cropped = image.cropping(to: rect) else { throw VisualError.screenshotFailed }
        let output = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(output, "public.png" as CFString, 1, nil) else {
            throw VisualError.screenshotFailed
        }
        CGImageDestinationAddImage(destination, cropped, nil)
        guard CGImageDestinationFinalize(destination) else { throw VisualError.screenshotFailed }
        return output as Data
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
