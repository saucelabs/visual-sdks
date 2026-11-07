import CoreGraphics
import Foundation
import XCTest

/// The element tree for `captureDom`, as Appium XCUITest page source (`<AppiumAUT>`), which the backend
/// reads as an iOS DOM. Frames are in points, scaled by `devicePixelRatio`.
internal struct DomSnapshot: Hashable, Sendable {
    let xml: Data
    /// Pixels per point of the screenshot, sent as `devicePixelRatio`.
    let devicePixelRatio: Double
}

/// One element of the tree. Kept apart from `XCUIElementSnapshot` so tests can build trees by hand.
internal struct DomNode: Hashable, Sendable {
    var type: String
    var identifier: String = ""
    var label: String = ""
    var value: String?
    var enabled = true
    var selected = false
    /// In screen points.
    var frame: CGRect = .zero
    var children: [DomNode] = []
}

internal enum DomCapture {
    /// Reads `element`'s tree. `origin` is the uploaded image's top-left and `screen` the screen, in points.
    @MainActor
    static func capture(
        _ element: XCUIElement, origin: CGPoint, screen: CGRect, devicePixelRatio: Double
    ) throws -> DomSnapshot {
        try validateOrigin(origin)
        guard devicePixelRatio.isFinite, devicePixelRatio > 0, PixelRegion.isUsable(screen) else {
            throw VisualError.domCaptureFailed
        }
        let root = try node(from: element.snapshot())
        return DomSnapshot(xml: document(root, origin: origin, screen: screen), devicePixelRatio: devicePixelRatio)
    }

    @MainActor
    static func node(from snapshot: XCUIElementSnapshot) throws -> DomNode {
        var remainingNodes = 10_000
        // Reserve worst-case XML escaping and per-node markup before retaining another node.
        var remainingBytes = 8 * 1_024 * 1_024 - 1_024
        return try readNode(snapshot, depth: 0, remainingNodes: &remainingNodes, remainingBytes: &remainingBytes)
    }

    /// The page source for `root`, with frames moved so `origin` becomes `(0, 0)`.
    static func document(_ root: DomNode, origin: CGPoint, screen: CGRect) -> Data {
        var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<AppiumAUT>\n"
        write(root, index: 0, origin: origin, screen: screen, to: &xml)
        xml += "</AppiumAUT>\n"
        return Data(xml.utf8)
    }

    private static func write(_ node: DomNode, index: Int, origin: CGPoint, screen: CGRect, to xml: inout String) {
        var attributes: [(String, String)] = [("type", node.type)]
        // Appium's `name` is the accessibility identifier, or the label when there is none.
        let name = node.identifier.isEmpty ? node.label : node.identifier
        if !name.isEmpty { attributes.append(("name", name)) }
        if !node.label.isEmpty { attributes.append(("label", node.label)) }
        if let value = node.value { attributes.append(("value", value)) }
        attributes.append(("enabled", String(node.enabled)))
        let geometry = frameAttributes(node.frame, origin: origin)
        attributes.append(("visible", String(geometry != nil && isVisible(node.frame, on: screen))))
        attributes.append(("selected", String(node.selected)))
        if let geometry { attributes += geometry }
        attributes.append(("index", String(index)))

        xml += "<\(node.type)"
        for (key, value) in attributes { xml += " \(key)=\"\(escape(value))\"" }
        guard !node.children.isEmpty else {
            xml += "/>\n"
            return
        }
        xml += ">\n"
        for (childIndex, child) in node.children.enumerated() {
            write(child, index: childIndex, origin: origin, screen: screen, to: &xml)
        }
        xml += "</\(node.type)>\n"
    }

    /// Some elements, such as hidden ones, report an infinite or empty frame. Those, and frames with a
    /// negative size, are never visible.
    static func isVisible(_ frame: CGRect, on screen: CGRect) -> Bool {
        guard PixelRegion.isUsable(frame) else { return false }
        let visible = frame.intersection(screen)
        return !visible.isNull && visible.width > 0 && visible.height > 0
    }

    /// `value` rounded, or `nil` when it isn't finite or doesn't fit in an `Int`. `Int(_:)` would crash the
    /// test process instead, and a finite frame can still be far out of range.
    private static func wholeNumber(_ value: CGFloat) -> Int? {
        Int(exactly: value.rounded())
    }

    /// Escapes XML markup and drops characters XML 1.0 can't hold.
    static func escape(_ value: String) -> String {
        var escaped = ""
        escaped.unicodeScalars.reserveCapacity(value.unicodeScalars.count)
        for scalar in value.unicodeScalars {
            switch scalar {
            case "&": escaped += "&amp;"
            case "<": escaped += "&lt;"
            case ">": escaped += "&gt;"
            case "\"": escaped += "&quot;"
            case "'": escaped += "&apos;"
            case "\n": escaped += "&#10;"
            case "\r": escaped += "&#13;"
            case "\t": escaped += "&#9;"
            default:
                let code = scalar.value
                let allowed = (0x20...0xD7FF).contains(code) || (0xE000...0xFFFD).contains(code)
                    || (0x10000...0x10FFFF).contains(code)
                if allowed { escaped.unicodeScalars.append(scalar) }
            }
        }
        return escaped
    }

    /// Switches report `0` or `1`, sliders a number, text fields their text.
    private static func text(_ value: Any?) -> String? {
        switch value {
        case let string as String: return string.isEmpty ? nil : string
        case let number as NSNumber: return number.stringValue
        default: return nil
        }
    }

    static func typeName(_ type: XCUIElement.ElementType) -> String {
        let index = Int(type.rawValue)
        return typeNames.indices.contains(index) ? "XCUIElementType" + typeNames[index] : "XCUIElementTypeOther"
    }

    /// `XCUIElement.ElementType` raw values 0 to 82, in the order of `XCUIElementTypes.h`.
    private static let typeNames = [
        "Any", "Other", "Application", "Group", "Window", "Sheet", "Drawer", "Alert", "Dialog", "Button",
        "RadioButton", "RadioGroup", "CheckBox", "DisclosureTriangle", "PopUpButton", "ComboBox", "MenuButton",
        "ToolbarButton", "Popover", "Keyboard", "Key", "NavigationBar", "TabBar", "TabGroup", "Toolbar",
        "StatusBar", "Table", "TableRow", "TableColumn", "Outline", "OutlineRow", "Browser", "CollectionView",
        "Slider", "PageIndicator", "ProgressIndicator", "ActivityIndicator", "SegmentedControl", "Picker",
        "PickerWheel", "Switch", "Toggle", "Link", "Image", "Icon", "SearchField", "ScrollView", "ScrollBar",
        "StaticText", "TextField", "SecureTextField", "DatePicker", "TextView", "Menu", "MenuItem", "MenuBar",
        "MenuBarItem", "Map", "WebView", "IncrementArrow", "DecrementArrow", "Timeline", "RatingIndicator",
        "ValueIndicator", "SplitGroup", "Splitter", "RelevanceIndicator", "ColorWell", "HelpTag", "Matte",
        "DockItem", "Ruler", "RulerMarker", "Grid", "LevelIndicator", "Cell", "LayoutArea", "LayoutItem",
        "Handle", "Stepper", "Tab", "TouchBar", "StatusItem"
    ]

    static func validateOrigin(_ origin: CGPoint) throws {
        guard origin.x.isFinite, origin.y.isFinite,
              origin.x == origin.x.rounded(), origin.y == origin.y.rounded() else {
            throw VisualError.unsupportedCaptureCombination
        }
    }

    @MainActor
    private static func readNode(
        _ snapshot: XCUIElementSnapshot, depth: Int,
        remainingNodes: inout Int, remainingBytes: inout Int
    ) throws -> DomNode {
        try Task.checkCancellation()
        guard depth <= 64, remainingNodes > 0 else { throw VisualError.captureBudgetExceeded }
        remainingNodes -= 1
        let identifier = snapshot.identifier
        let label = snapshot.label
        let value = text(snapshot.value) ?? snapshot.placeholderValue.flatMap { $0.isEmpty ? nil : $0 }
        var estimate = 512
        for string in [identifier, label, value ?? ""] {
            let escaped = string.utf8.count.multipliedReportingOverflow(by: 6)
            let next = estimate.addingReportingOverflow(escaped.partialValue)
            guard !escaped.overflow, !next.overflow else { throw VisualError.captureBudgetExceeded }
            estimate = next.partialValue
        }
        // `name` may repeat the label; reserve it separately.
        let name = identifier.isEmpty ? label : identifier
        let duplicate = name.utf8.count.multipliedReportingOverflow(by: 6)
        let total = estimate.addingReportingOverflow(duplicate.partialValue)
        guard !duplicate.overflow, !total.overflow, total.partialValue <= remainingBytes else {
            throw VisualError.captureBudgetExceeded
        }
        remainingBytes -= total.partialValue
        var children: [DomNode] = []
        for child in snapshot.children {
            children.append(try readNode(child, depth: depth + 1,
                                         remainingNodes: &remainingNodes, remainingBytes: &remainingBytes))
        }
        return DomNode(type: typeName(snapshot.elementType), identifier: identifier, label: label, value: value,
                       enabled: snapshot.isEnabled, selected: snapshot.isSelected, frame: snapshot.frame, children: children)
    }

    private static func frameAttributes(_ frame: CGRect, origin: CGPoint) -> [(String, String)]? {
        guard PixelRegion.isUsable(frame), origin.x.isFinite, origin.y.isFinite,
              let x = wholeNumber(frame.minX - origin.x), let y = wholeNumber(frame.minY - origin.y),
              let width = wholeNumber(frame.width), let height = wholeNumber(frame.height),
              width > 0, height > 0 else { return nil }
        return [("x", String(x)), ("y", String(y)), ("width", String(width)), ("height", String(height))]
    }
}
