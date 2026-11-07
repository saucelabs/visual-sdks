import CoreGraphics
import Foundation
import XCTest

/// Options for one check. Every field is optional.
/// Rectangles are in points, like `XCUIElement.frame`.
public struct VisualCheckOptions {
    /// Defaults to the running test's method name.
    public var testName: String?
    /// Defaults to the running test's class name.
    public var suiteName: String?
    /// Snapshot only this element instead of the whole screen. Only its on-screen part is kept.
    public var clipElement: XCUIElement?
    /// Areas to leave out of the comparison.
    public var ignoreRegions: [CGRect]
    /// Elements to leave out of the comparison. Each must exist when the check runs.
    public var ignoreElements: [XCUIElement]
    /// Areas with their own rules, for example "only report visual changes here".
    public var regions: [SelectiveRegion]
    /// Defaults to `.balanced`.
    public var diffingMethod: DiffingMethod?
    /// Which kinds of change to report. Leave `nil` for the default.
    public var diffingOptions: DiffingOptions?
    /// How strict the `.balanced` method is. Leave `nil` for the default.
    public var diffingMethodSensitivity: DiffingMethodSensitivity?
    /// Detailed thresholds for the `.balanced` method. Leave `nil` for the default.
    public var diffingMethodTolerance: DiffingMethodTolerance?
    /// Compare against another snapshot's baseline. Replaces the client's override for this check.
    public var baselineOverride: BaselineOverride?
    /// Require capture and upload of the element tree. Off by default; failure throws.
    public var captureDom: Bool
    /// Bounded scroll capture with explicit failure/extent reporting. Ignored when `clipElement` is a different element.
    public var fullPage: FullPageScreenshot?

    public init(
        testName: String? = nil,
        suiteName: String? = nil,
        clipElement: XCUIElement? = nil,
        ignoreRegions: [CGRect] = [],
        ignoreElements: [XCUIElement] = [],
        regions: [SelectiveRegion] = [],
        diffingMethod: DiffingMethod? = nil,
        diffingOptions: DiffingOptions? = nil,
        diffingMethodSensitivity: DiffingMethodSensitivity? = nil,
        diffingMethodTolerance: DiffingMethodTolerance? = nil,
        baselineOverride: BaselineOverride? = nil,
        captureDom: Bool = false,
        fullPage: FullPageScreenshot? = nil
    ) {
        self.testName = testName
        self.suiteName = suiteName
        self.clipElement = clipElement
        self.ignoreRegions = ignoreRegions
        self.ignoreElements = ignoreElements
        self.regions = regions
        self.diffingMethod = diffingMethod
        self.diffingOptions = diffingOptions
        self.diffingMethodSensitivity = diffingMethodSensitivity
        self.diffingMethodTolerance = diffingMethodTolerance
        self.baselineOverride = baselineOverride
        self.captureDom = captureDom
        self.fullPage = fullPage
    }

    /// The element to scroll, unless a different `clipElement` takes precedence.
    var fullPageElement: XCUIElement? {
        guard let fullPage, clipElement == nil || clipElement == fullPage.scrollElement else { return nil }
        return fullPage.scrollElement
    }
}

/// Scrolls an element and stitches its screenshots into one image. Not available on tvOS.
public struct FullPageScreenshot {
    public var scrollElement: XCUIElement
    /// Maximum screenshots, including the initial viewport. Valid range: 1...100.
    public var scrollLimit: Int
    public var delayAfterScroll: TimeInterval
    /// Explicitly permit a bounded prefix when the screenshot limit is reached.
    /// The receipt then reports `.limitReached`; ambiguity and instability still throw.
    public var allowPartialAtLimit: Bool
    /// Client-side canvas safety budget, at most 32,000,000 pixels.
    public var maximumOutputPixels: Int
    /// Monotonic capture deadline, excluding upload. Valid range: greater than 0, at most 300 seconds.
    public var maximumDuration: TimeInterval

    public init(
        scrollElement: XCUIElement, scrollLimit: Int = 10, delayAfterScroll: TimeInterval = 0.5,
        allowPartialAtLimit: Bool = false, maximumOutputPixels: Int = 20_000_000,
        maximumDuration: TimeInterval = 60
    ) {
        self.scrollElement = scrollElement
        self.scrollLimit = scrollLimit
        self.delayAfterScroll = delayAfterScroll
        self.allowPartialAtLimit = allowPartialAtLimit
        self.maximumOutputPixels = maximumOutputPixels
        self.maximumDuration = maximumDuration
    }

    static func validate(
        scrollLimit: Int, delayAfterScroll: TimeInterval,
        maximumOutputPixels: Int = 20_000_000, maximumDuration: TimeInterval = 60
    ) throws {
        guard (1...CaptureLimits.maximumFrames).contains(scrollLimit),
              delayAfterScroll.isFinite, delayAfterScroll >= 0,
              maximumDuration.isFinite, maximumDuration > 0,
              maximumDuration <= CaptureLimits.maximumDuration,
              delayAfterScroll < maximumDuration,
              (1...CaptureLimits.maximumOutputPixels).contains(maximumOutputPixels) else {
            throw VisualError.invalidCheckOptions
        }
    }
}

/// A rectangle or element with its own comparison rules.
public struct SelectiveRegion {
    internal enum Area {
        case rect(CGRect)
        case element(XCUIElement)
    }

    internal let area: Area
    public let name: String?
    /// The kinds of change reported in the area, or `nil` to ignore it.
    public let diffingOptions: DiffingOptions?

    /// Leaves the area out of the comparison.
    public static func ignoreChanges(in rect: CGRect, name: String? = nil) -> SelectiveRegion {
        SelectiveRegion(area: .rect(rect), name: name, diffingOptions: nil)
    }

    /// Leaves the element out of the comparison.
    public static func ignoreChanges(in element: XCUIElement, name: String? = nil) -> SelectiveRegion {
        SelectiveRegion(area: .element(element), name: name, diffingOptions: nil)
    }

    /// Reports only the given kinds of change in the area.
    public static func detectChanges(
        in rect: CGRect, _ options: DiffingOptions = .all, name: String? = nil
    ) -> SelectiveRegion {
        SelectiveRegion(area: .rect(rect), name: name, diffingOptions: options)
    }

    /// Reports only the given kinds of change in the element.
    public static func detectChanges(
        in element: XCUIElement, _ options: DiffingOptions = .all, name: String? = nil
    ) -> SelectiveRegion {
        SelectiveRegion(area: .element(element), name: name, diffingOptions: options)
    }
}

/// How screenshots are compared. The older pixel-by-pixel `SIMPLE` method isn't offered.
public enum DiffingMethod: String, Hashable, Sendable {
    /// Ignores anti-aliasing and tiny rendering differences. Recommended.
    case balanced = "BALANCED"
    case experimental = "EXPERIMENTAL"
}

/// Kinds of change to report. `content`, `structure`, and `style` need `captureDom`.
public struct DiffingOptions: OptionSet, Hashable, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }

    public static let content = DiffingOptions(rawValue: 1 << 0)
    public static let dimensions = DiffingOptions(rawValue: 1 << 1)
    public static let position = DiffingOptions(rawValue: 1 << 2)
    public static let structure = DiffingOptions(rawValue: 1 << 3)
    public static let style = DiffingOptions(rawValue: 1 << 4)
    public static let visual = DiffingOptions(rawValue: 1 << 5)
    public static let all: DiffingOptions = [.content, .dimensions, .position, .structure, .style, .visual]
}

public enum DiffingMethodSensitivity: String, Hashable, Sendable {
    /// Fewer false alarms, but may miss small changes.
    case low = "LOW"
    case balanced = "BALANCED"
    /// Catches every pixel change, with more false alarms.
    case high = "HIGH"
}

/// Thresholds for the `.balanced` method. Fields left `nil` keep the default.
public struct DiffingMethodTolerance: Hashable, Sendable {
    /// 0 allows no change in color, 1 allows any.
    public var color: Double?
    /// 0 allows no change in brightness, 1 allows nearly any.
    public var brightness: Double?
    /// 0 always reports anti-aliasing, 1 may miss changes in small text or symbols.
    public var antiAliasing: Double?
    /// Changes smaller than this many pixels across are not reported.
    public var minChangeSize: Int?

    public init(color: Double? = nil, brightness: Double? = nil, antiAliasing: Double? = nil, minChangeSize: Int? = nil) {
        self.color = color
        self.brightness = brightness
        self.antiAliasing = antiAliasing
        self.minChangeSize = minChangeSize
    }

    /// Checks the ranges the API documents, so a bad value fails before any upload. NaN and infinity
    /// fall outside the range too.
    /// - Throws: `VisualError.invalidCheckOptions`.
    internal func validate() throws {
        let fractions = [color, brightness, antiAliasing].compactMap { $0 }
        guard fractions.allSatisfy({ $0.isFinite && (0...1).contains($0) }),
              (0...Int(Int32.max)).contains(minChangeSize ?? 0) else {
            throw VisualError.invalidCheckOptions
        }
    }
}

/// Values used instead of the snapshot's own when looking up its baseline. Each field has three states:
/// `nil` (unset) keeps the snapshot's own value, `.value(x)` matches `x`, and `.null` matches baselines with no value.
/// Baselines also match on test and suite names, so set those to use another test's.
public struct BaselineOverride: Hashable, Sendable {
    public var name: BaselineValue<String>?
    public var testName: BaselineValue<String>?
    public var suiteName: BaselineValue<String>?
    public var device: BaselineValue<String>?
    public var operatingSystem: BaselineValue<OperatingSystem>?
    public var operatingSystemVersion: BaselineValue<String>?

    public init(
        name: BaselineValue<String>? = nil,
        testName: BaselineValue<String>? = nil,
        suiteName: BaselineValue<String>? = nil,
        device: BaselineValue<String>? = nil,
        operatingSystem: BaselineValue<OperatingSystem>? = nil,
        operatingSystemVersion: BaselineValue<String>? = nil
    ) {
        self.name = name
        self.testName = testName
        self.suiteName = suiteName
        self.device = device
        self.operatingSystem = operatingSystem
        self.operatingSystemVersion = operatingSystemVersion
    }

    /// True when nothing is overridden.
    var isEmpty: Bool { self == BaselineOverride() }
}

/// A baseline override field that is set: either a value to match, or `.null` to match baselines without one.
/// String fields accept a literal directly: `name: "Login page"`.
public enum BaselineValue<Wrapped: Hashable & Sendable>: Hashable, Sendable {
    case value(Wrapped)
    /// Sent as `null`, matching baselines that have no value for this field.
    case null

    func map<T>(_ transform: (Wrapped) -> T) -> BaselineValue<T> {
        switch self {
        case .value(let value): return .value(transform(value))
        case .null: return .null
        }
    }
}

extension BaselineValue: ExpressibleByUnicodeScalarLiteral, ExpressibleByExtendedGraphemeClusterLiteral,
    ExpressibleByStringLiteral where Wrapped == String {
    public init(stringLiteral value: String) {
        self = .value(value)
    }
}

/// Lets the operating system be written directly: `operatingSystem: .ios` instead of `.value(.ios)`.
extension BaselineValue where Wrapped == OperatingSystem {
    public static var ios: Self { .value(.ios) }
    public static var macos: Self { .value(.macos) }
    public static var android: Self { .value(.android) }
    public static var windows: Self { .value(.windows) }
    public static var linux: Self { .value(.linux) }
    public static var unknown: Self { .value(.unknown) }
}

/// Operating systems the Sauce Visual API knows.
public enum OperatingSystem: String, Hashable, Sendable {
    case ios = "IOS"
    case macos = "MACOS"
    case android = "ANDROID"
    case windows = "WINDOWS"
    case linux = "LINUX"
    /// For example tvOS, which the API doesn't list.
    case unknown = "UNKNOWN"
}

// MARK: - Resolution

/// What a check needs besides the screenshot, with elements already turned into pixel rectangles.
internal struct SnapshotRequest: Hashable, Sendable {
    var test = TestIdentity()
    var clip: CGRect?
    var regions: [PixelRegion] = []
    var diffingMethod: DiffingMethod = .balanced
    var diffingOptions: DiffingOptions?
    var diffingMethodSensitivity: DiffingMethodSensitivity?
    var diffingMethodTolerance: DiffingMethodTolerance?
    var baselineOverride: BaselineOverride?
    var dom: DomSnapshot?
    var fullPage: [FullPageCapture.Frame]?
    var captureExtent: VisualCaptureExtent = .viewport
    var maxOutputPixels: Int = CaptureLimits.defaultOutputPixels
    var pixelWidth: Int = 0
    var pixelHeight: Int = 0

    func validate() throws {
        try diffingMethodTolerance?.validate()
        let selections = [diffingOptions].compactMap { $0 } + regions.compactMap(\.diffingOptions)
        for selection in selections {
            guard selection.subtracting(.all).isEmpty else { throw VisualError.invalidCheckOptions }
            if !selection.intersection([.content, .structure, .style]).isEmpty && dom == nil {
                throw VisualError.unsupportedCaptureCombination
            }
        }
        if fullPage != nil || captureExtent != .viewport {
            guard clip != nil, regions.isEmpty, dom == nil,
                  selections.allSatisfy({ $0.intersection([.content, .structure, .style]).isEmpty }) else {
                throw VisualError.unsupportedCaptureCombination
            }
        }
        guard maxOutputPixels > 0, maxOutputPixels <= CaptureLimits.maximumOutputPixels else {
            throw VisualError.invalidCheckOptions
        }
    }
}

/// A region in screenshot pixels, as the API expects.
internal struct PixelRegion: Hashable, Sendable {
    let x: Int
    let y: Int
    let width: Int
    let height: Int
    let name: String?
    let diffingOptions: DiffingOptions?

    /// Converts screen points to pixels inside `image`, the uploaded part of the screen in pixels.
    /// `nil` when the area is outside it.
    init?(_ rect: CGRect, scale: CGFloat, in image: CGRect, name: String?, diffingOptions: DiffingOptions?) {
        // Checked conversion, so a value that doesn't fit in an `Int` drops the region instead of crashing.
        guard let pixels = Self.pixels(rect, scale: scale, in: image),
              let x = Int(exactly: pixels.minX - image.minX), let y = Int(exactly: pixels.minY - image.minY),
              let width = Int(exactly: pixels.width), let height = Int(exactly: pixels.height) else { return nil }
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.name = name
        self.diffingOptions = diffingOptions
    }

    private init(x: Int, y: Int, width: Int, height: Int, name: String?, diffingOptions: DiffingOptions?) {
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.name = name
        self.diffingOptions = diffingOptions
    }

    /// The part above row `limit`, or `nil` when nothing is left.
    func cut(atHeight limit: Int) -> PixelRegion? {
        guard y < limit else { return nil }
        return PixelRegion(x: x, y: y, width: width, height: min(height, limit - y), name: name, diffingOptions: diffingOptions)
    }

    /// Scales `rect` to whole pixels and clips it to `bounds`. `nil` when `rect` or `scale` isn't usable,
    /// or nothing is left.
    static func pixels(_ rect: CGRect, scale: CGFloat, in bounds: CGRect) -> CGRect? {
        guard isUsable(rect), isUsable(bounds), scale.isFinite, scale > 0 else { return nil }
        let x = rect.origin.x * scale
        let y = rect.origin.y * scale
        let width = rect.size.width * scale
        let height = rect.size.height * scale
        let values = [x, y, width, height, x + width, y + height,
                      bounds.minX, bounds.minY, bounds.maxX, bounds.maxY]
        guard values.allSatisfy(\.isFinite),
              values.allSatisfy({ Int(exactly: $0.rounded(.down)) != nil && Int(exactly: $0.rounded(.up)) != nil }) else {
            return nil
        }
        // XCUI can describe a stationary, pixel-aligned edge a few floating-point steps either
        // side of its value (for example 278.66666666666663 points at 3x). Remove only that
        // arithmetic noise before rounding outwards; genuine fractional pixels still expand.
        func edge(_ value: CGFloat) -> CGFloat {
            let integer = value.rounded()
            let tolerance = min(8 * max(value.ulp, CGFloat.ulpOfOne), 0.000_001)
            return abs(value - integer) <= tolerance ? integer : value
        }
        let left = edge(x).rounded(.down)
        let top = edge(y).rounded(.down)
        let right = edge(x + width).rounded(.up)
        let bottom = edge(y + height).rounded(.up)
        let pixels = CGRect(x: left, y: top, width: right - left, height: bottom - top).intersection(bounds)
        guard isUsable(pixels), !pixels.isNull else { return nil }
        return pixels
    }

    /// A finite position and a positive size. Reads `size` directly, because `width` and `height` turn a
    /// negative size positive, which would move the rectangle to another area.
    static func isUsable(_ rect: CGRect) -> Bool {
        let values = [rect.origin.x, rect.origin.y, rect.size.width, rect.size.height]
        return values.allSatisfy(\.isFinite) && rect.size.width > 0 && rect.size.height > 0
    }
}

extension VisualCheckOptions {
    /// Checks caller input before the screenshot: tolerance ranges, and rectangles that need a finite
    /// position and a positive size. Element frames are only known later, when the check resolves them.
    /// - Throws: `VisualError.invalidCheckOptions`.
    func validate() throws {
        try diffingMethodTolerance?.validate()
        let rects = ignoreRegions + regions.compactMap { region -> CGRect? in
            if case .rect(let rect) = region.area { return rect }
            return nil
        }
        guard rects.allSatisfy(PixelRegion.isUsable) else { throw VisualError.invalidCheckOptions }
        let selections = [diffingOptions].compactMap { $0 } + regions.compactMap(\.diffingOptions)
        for selection in selections {
            guard selection.subtracting(.all).isEmpty else { throw VisualError.invalidCheckOptions }
            if !selection.intersection([.content, .structure, .style]).isEmpty && !captureDom {
                throw VisualError.unsupportedCaptureCombination
            }
        }
        if fullPageElement != nil, let fullPage {
            try FullPageScreenshot.validate(
                scrollLimit: fullPage.scrollLimit, delayAfterScroll: fullPage.delayAfterScroll,
                maximumOutputPixels: fullPage.maximumOutputPixels, maximumDuration: fullPage.maximumDuration
            )
            // First-viewport metadata cannot be projected into a stitched image without a defined
            // content/overlay mapping. Reject it rather than mask the wrong pixels or claim full DOM coverage.
            guard !captureDom, ignoreRegions.isEmpty, ignoreElements.isEmpty, regions.isEmpty else {
                throw VisualError.unsupportedCaptureCombination
            }
        }
    }

    /// Reads element frames, which XCUI only allows on the main actor.
    /// - Throws: `VisualError.elementNotFound`, `.clipElementOffScreen`, or `.screenshotFailed`.
    @MainActor
    func resolve(running test: TestIdentity, screenshot: Screenshot.Capture) throws -> SnapshotRequest {
        let size = screenshot.pixelSize
        guard screenshot.scale.isFinite, screenshot.scale > 0, size.width > 0, size.height > 0 else {
            throw VisualError.screenshotFailed
        }
        let screen = CGRect(origin: .zero, size: size)
        var clip: CGRect?
        if let element = clipElement ?? fullPageElement {
            guard element.exists else { throw VisualError.elementNotFound }
            guard let pixels = PixelRegion.pixels(element.frame, scale: screenshot.scale, in: screen) else {
                throw VisualError.clipElementOffScreen
            }
            clip = pixels
        }
        // Regions are relative to the uploaded image, so to the clip element when there is one.
        let image = clip ?? screen
        func pixels(_ area: SelectiveRegion.Area, name: String?, options: DiffingOptions?) throws -> PixelRegion? {
            let rect: CGRect
            switch area {
            case .rect(let value):
                rect = value
            case .element(let element):
                guard element.exists else { throw VisualError.elementNotFound }
                rect = element.frame
            }
            let region = PixelRegion(rect, scale: screenshot.scale, in: image, name: name, diffingOptions: options)
            if region == nil {
                // Not an error, since elements can scroll away, but tell the user nothing was ignored.
                print("Sauce Visual: skipped region \(name.map { "\"\($0)\" " } ?? "")at \(rect), which is empty or outside the screenshot.")
            }
            return region
        }
        var resolved: [PixelRegion] = []
        for rect in ignoreRegions {
            if let region = try pixels(.rect(rect), name: nil, options: nil) { resolved.append(region) }
        }
        for element in ignoreElements {
            if let region = try pixels(.element(element), name: nil, options: nil) { resolved.append(region) }
        }
        for region in regions {
            if let region = try pixels(region.area, name: region.name, options: region.diffingOptions) {
                resolved.append(region)
            }
        }
        return SnapshotRequest(
            test: test.overriding(testName: testName, suiteName: suiteName),
            clip: clip,
            regions: resolved,
            diffingMethod: diffingMethod ?? .balanced,
            diffingOptions: diffingOptions,
            diffingMethodSensitivity: diffingMethodSensitivity,
            diffingMethodTolerance: diffingMethodTolerance,
            baselineOverride: baselineOverride
        )
    }
}
