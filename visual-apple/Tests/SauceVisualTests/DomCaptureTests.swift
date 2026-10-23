import CoreGraphics
import Foundation
import XCTest
// Release runs need `-Xswiftc -enable-testing` for this import.
@testable import SauceVisual

// `@unchecked Sendable` is safe: the tests keep no shared state.
final class DomCaptureTests: XCTestCase, @unchecked Sendable {
    private let screen = CGRect(x: 0, y: 0, width: 402, height: 874)

    private func xml(_ root: DomNode, origin: CGPoint = .zero) -> String {
        String(decoding: DomCapture.document(root, origin: origin, screen: screen), as: UTF8.self)
    }

    func testTreeIsWrittenAsAppiumPageSource() {
        let root = DomNode(
            type: "XCUIElementTypeApplication", label: "Demo", frame: screen,
            children: [
                DomNode(type: "XCUIElementTypeButton", identifier: "login", label: "Log in",
                        frame: CGRect(x: 20.4, y: 100.6, width: 120, height: 44)),
                DomNode(type: "XCUIElementTypeTextField", label: "Username", value: "standard_user", enabled: false,
                        selected: true, frame: CGRect(x: 20, y: 160, width: 300, height: 40))
            ]
        )

        XCTAssertEqual(xml(root), """
        <?xml version="1.0" encoding="UTF-8"?>
        <AppiumAUT>
        <XCUIElementTypeApplication type="XCUIElementTypeApplication" name="Demo" label="Demo" enabled="true" \
        visible="true" selected="false" x="0" y="0" width="402" height="874" index="0">
        <XCUIElementTypeButton type="XCUIElementTypeButton" name="login" label="Log in" enabled="true" \
        visible="true" selected="false" x="20" y="101" width="120" height="44" index="0"/>
        <XCUIElementTypeTextField type="XCUIElementTypeTextField" name="Username" label="Username" \
        value="standard_user" enabled="false" visible="true" selected="true" x="20" y="160" width="300" height="40" index="1"/>
        </XCUIElementTypeApplication>
        </AppiumAUT>

        """)
    }

    func testBackendRecognizesTheDocumentAsIos() {
        // The diffing engine looks for <AppiumAUT> in the first 1000 characters.
        let start = xml(DomNode(type: "XCUIElementTypeApplication")).prefix(1000)
        XCTAssertTrue(start.hasPrefix("<?xml"))
        XCTAssertTrue(start.contains("<AppiumAUT>"))
    }

    func testClipOriginMovesFramesAndVisibilityUsesTheScreen() {
        let root = DomNode(type: "XCUIElementTypeOther", frame: CGRect(x: 50, y: 300, width: 100, height: 20), children: [
            DomNode(type: "XCUIElementTypeStaticText", frame: CGRect(x: 60, y: 1000, width: 50, height: 20)),
            DomNode(type: "XCUIElementTypeOther", frame: CGRect(x: CGFloat.infinity, y: 0, width: 0, height: 0))
        ])
        let output = xml(root, origin: CGPoint(x: 50, y: 300))

        XCTAssertTrue(output.contains("visible=\"true\" selected=\"false\" x=\"0\" y=\"0\" width=\"100\""), "Rebased to the clip")
        XCTAssertTrue(output.contains("visible=\"false\" selected=\"false\" x=\"10\" y=\"700\""), "Below the screen")
        XCTAssertTrue(output.contains("visible=\"false\" selected=\"false\" index=\"1\""), "No frame, no coordinates")
    }

    func testCoordinatesThatDontFitAnIntAreLeftOut() {
        let huge = CGFloat(1e300)
        let largest = CGFloat.greatestFiniteMagnitude
        let cases: [(String, DomNode, CGPoint)] = [
            // Finite, but far beyond what an `Int` holds, so `Int(_:)` would crash the test process.
            ("huge x", DomNode(type: "XCUIElementTypeStaticText", frame: CGRect(x: huge, y: 0, width: 10, height: 10)), .zero),
            ("huge width", DomNode(type: "XCUIElementTypeStaticText", frame: CGRect(x: 0, y: 0, width: huge, height: 10)), .zero),
            // Finite until the origin moves it, which overflows to infinity.
            ("overflowing x", DomNode(type: "XCUIElementTypeButton", frame: CGRect(x: -largest, y: 0, width: 10, height: 10)),
             CGPoint(x: largest, y: 0))
        ]
        for (label, node, origin) in cases {
            let element = xml(node, origin: origin).split(separator: "\n")[2]
            XCTAssertFalse(element.contains(" x="), label)
            XCTAssertFalse(element.contains(" width="), label)
            XCTAssertTrue(element.contains("index=\"0\""), "The element itself is still written: \(label)")
        }
    }

    func testOnlyUsableFramesCanBeVisible() {
        let hidden: [(String, CGRect)] = [
            // Overlaps the screen once `CGRect` normalizes the negative width.
            ("negative width", CGRect(x: 100, y: 100, width: -50, height: 20)),
            ("zero size", CGRect(x: 100, y: 100, width: 0, height: 0)),
            ("NaN origin", CGRect(x: CGFloat.nan, y: 100, width: 50, height: 20)),
            ("infinite origin", CGRect(x: CGFloat.infinity, y: 100, width: 50, height: 20)),
            ("off screen", CGRect(x: 0, y: 2000, width: 50, height: 20))
        ]
        for (label, frame) in hidden {
            XCTAssertFalse(DomCapture.isVisible(frame, on: screen), label)
        }
        XCTAssertTrue(DomCapture.isVisible(CGRect(x: 100, y: 100, width: 50, height: 20), on: screen))
    }

    func testAttributesAreEscaped() {
        XCTAssertEqual(DomCapture.escape("a & b < c > \"d\" 'e'"), "a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;")
        XCTAssertEqual(DomCapture.escape("line\nbreak\tTab"), "line&#10;break&#9;Tab")
        XCTAssertEqual(DomCapture.escape("bell\u{7}gone \u{FFFE}too 😀"), "bellgone too 😀", "Characters XML can't hold are dropped")
    }

    func testElementTypeNames() {
        XCTAssertEqual(DomCapture.typeName(.any), "XCUIElementTypeAny")
        XCTAssertEqual(DomCapture.typeName(.button), "XCUIElementTypeButton")
        XCTAssertEqual(DomCapture.typeName(.staticText), "XCUIElementTypeStaticText")
        XCTAssertEqual(DomCapture.typeName(.webView), "XCUIElementTypeWebView")
        XCTAssertEqual(DomCapture.typeName(.cell), "XCUIElementTypeCell")
        XCTAssertEqual(DomCapture.typeName(.statusItem), "XCUIElementTypeStatusItem", "Last entry, so the table has no gaps")
        XCTAssertEqual(DomCapture.typeName(XCUIElement.ElementType(rawValue: 999)!), "XCUIElementTypeOther")
    }

    func testCaptureIsOffByDefault() {
        XCTAssertFalse(VisualCheckOptions().captureDom)
        XCTAssertNil(SnapshotRequest().dom)
    }
}
