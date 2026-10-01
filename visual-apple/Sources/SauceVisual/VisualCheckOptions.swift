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

    public init(
        testName: String? = nil,
        suiteName: String? = nil,
        ignoreRegions: [CGRect] = [],
        ignoreElements: [XCUIElement] = [],
        regions: [SelectiveRegion] = [],
        diffingMethod: DiffingMethod? = nil,
        diffingOptions: DiffingOptions? = nil,
        diffingMethodSensitivity: DiffingMethodSensitivity? = nil,
        diffingMethodTolerance: DiffingMethodTolerance? = nil
    ) {
        self.testName = testName
        self.suiteName = suiteName
        self.ignoreRegions = ignoreRegions
        self.ignoreElements = ignoreElements
        self.regions = regions
        self.diffingMethod = diffingMethod
        self.diffingOptions = diffingOptions
        self.diffingMethodSensitivity = diffingMethodSensitivity
        self.diffingMethodTolerance = diffingMethodTolerance
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

public enum DiffingMethod: String, Hashable, Sendable {
    /// Pixel by pixel.
    case simple = "SIMPLE"
    /// Ignores anti-aliasing and tiny rendering differences. Recommended.
    case balanced = "BALANCED"
    case experimental = "EXPERIMENTAL"
}

/// Kinds of change to report. Only `visual`, `dimensions`, and `position` apply for now;
/// the others need an element tree, which the SDK doesn't upload yet.
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
}

// MARK: - Resolution

/// What a check sends besides the image, with elements already turned into pixel rectangles.
internal struct SnapshotRequest: Hashable, Sendable {
    var test = TestIdentity()
    var regions: [PixelRegion] = []
    var diffingMethod: DiffingMethod = .balanced
    var diffingOptions: DiffingOptions?
    var diffingMethodSensitivity: DiffingMethodSensitivity?
    var diffingMethodTolerance: DiffingMethodTolerance?
}

/// A region in screenshot pixels, as the API expects.
internal struct PixelRegion: Hashable, Sendable {
    let x: Int
    let y: Int
    let width: Int
    let height: Int
    let name: String?
    let diffingOptions: DiffingOptions?

    /// Converts points to pixels and clips to the image. `nil` when the area is off screen.
    init?(_ rect: CGRect, scale: CGFloat, imageSize: CGSize, name: String?, diffingOptions: DiffingOptions?) {
        guard rect.width.isFinite, rect.height.isFinite, !rect.isNull else { return nil }
        let pixels = CGRect(x: rect.minX * scale, y: rect.minY * scale, width: rect.width * scale, height: rect.height * scale)
            .integral
            .intersection(CGRect(origin: .zero, size: imageSize))
        guard !pixels.isNull, pixels.width > 0, pixels.height > 0 else { return nil }
        self.x = Int(pixels.minX)
        self.y = Int(pixels.minY)
        self.width = Int(pixels.width)
        self.height = Int(pixels.height)
        self.name = name
        self.diffingOptions = diffingOptions
    }
}

extension VisualCheckOptions {
    /// Reads element frames, which XCUI only allows on the main actor.
    /// - Throws: `VisualError.elementNotFound` when an element doesn't exist.
    @MainActor
    func resolve(running test: TestIdentity, screenshot: Screenshot.Capture) throws -> SnapshotRequest {
        func pixels(_ area: SelectiveRegion.Area, name: String?, options: DiffingOptions?) throws -> PixelRegion? {
            let rect: CGRect
            switch area {
            case .rect(let value):
                rect = value
            case .element(let element):
                guard element.exists else { throw VisualError.elementNotFound }
                rect = element.frame
            }
            let region = PixelRegion(rect, scale: screenshot.scale, imageSize: screenshot.pixelSize, name: name, diffingOptions: options)
            if region == nil {
                // Not an error, since elements can scroll away, but tell the user nothing was ignored.
                print("Sauce Visual: skipped region \(name.map { "\"\($0)\" " } ?? "")at \(rect), which is outside the screenshot.")
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
            regions: resolved,
            diffingMethod: diffingMethod ?? .balanced,
            diffingOptions: diffingOptions,
            diffingMethodSensitivity: diffingMethodSensitivity,
            diffingMethodTolerance: diffingMethodTolerance
        )
    }
}
