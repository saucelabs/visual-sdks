#if os(iOS)
import Foundation
import XCTest
import SauceVisual

/// Snapshots saucedemo.com in Safari, one flow per test, with the site's public demo account.
/// iOS only, because tvOS has no Safari.
final class SauceDemoTests: XCTestCase, @unchecked Sendable {
    private static let site = URL(string: "https://www.saucedemo.com")!

    /// One client for the whole class. Missing credentials fail each test instead of crashing the run.
    private static let client = Result { try VisualClient(options: liveBuildOptions) }
    private var visual: VisualClient { get throws { try Self.client.get() } }

    override func tearDown() async throws {
        await MainActor.run { Self.safari.terminate() }
    }

    @MainActor
    func testLoginPage() async throws {
        try openLoginPage()

        let snapshot = try await visual.sauceVisualCheck("Login page")
        XCTAssertNotNil(UUID(uuidString: snapshot.buildId))
        XCTAssertEqual(snapshot.suiteName, "SauceDemoTests")
        XCTAssertEqual(snapshot.testName, "testLoginPage")
    }

    @MainActor
    func testWrongPasswordShowsError() async throws {
        try openLoginPage()
        try logIn(password: "wrong_password")

        let error = page.staticTexts.containing(NSPredicate(format: "label BEGINSWITH 'Epic sadface'")).firstMatch
        try requireExists(error, timeout: 10, "No login error shown")
        try await visual.sauceVisualCheck("Login error")
    }

    @MainActor
    func testLoginShowsProducts() async throws {
        try openLoginPage()
        try openProductsPage()
        // Product descriptions change, so leave the first one out of the comparison.
        let description = page.staticTexts.containing(NSPredicate(format: "label BEGINSWITH 'carry.allTheThings()'")).firstMatch
        try await visual.sauceVisualCheck("Products page", options: VisualCheckOptions(ignoreElements: [description]))
    }

    @MainActor
    func testMenuLogsOut() async throws {
        try openLoginPage()
        try openProductsPage()

        page.buttons["Open Menu"].tap()
        // The menu item becomes tappable once the menu has slid in.
        let logout = page.buttons["Logout"]
        try requireHittable(logout, timeout: 10, "Menu did not open")
        try await visual.sauceVisualCheck("Menu")

        logout.tap()
        XCTAssertTrue(page.buttons["Login"].waitForExistence(timeout: 30), "Not logged out")
    }

    // MARK: - Steps

    /// Thrown when the screen isn't ready, so the test stops before uploading the wrong one. Unlike
    /// `continueAfterFailure = false`, this needs no Objective-C exception to unwind async Swift code.
    private enum PreparationError: Error, CustomStringConvertible {
        case requiredElementMissing(String)

        var description: String {
            switch self {
            case .requiredElementMissing(let reason): return reason
            }
        }
    }

    @MainActor
    private static var safari: XCUIApplication { XCUIApplication(bundleIdentifier: "com.apple.mobilesafari") }

    @MainActor
    private var page: XCUIElement { Self.safari.webViews.firstMatch }

    @MainActor
    private func open(_ url: URL) throws {
        guard #available(iOS 16.4, *) else {
            throw PreparationError.requiredElementMissing("Opening a URL from a UI test needs iOS 16.4.")
        }
        Self.safari.open(url)
    }

    @MainActor
    private func openLoginPage() throws {
        try open(Self.site)
        // Wait for the button to be tappable: the fields appear before the page is drawn.
        try requireHittable(page.buttons["Login"], timeout: 60, "Login page did not load")
    }

    /// Reloads the products page after logging in, to undo Safari's zoom into the login fields.
    @MainActor
    private func openProductsPage() throws {
        try logIn()
        try requireExists(page.staticTexts["Products"], timeout: 30, "Not logged in")
        try open(Self.site.appendingPathComponent("inventory.html"))
        try requireHittable(page.buttons["Open Menu"], timeout: 30, "Products page did not reload")
    }

    @MainActor
    private func requireExists(_ element: XCUIElement, timeout: TimeInterval, _ reason: String) throws {
        try Task.checkCancellation()
        guard element.waitForExistence(timeout: timeout) else {
            throw PreparationError.requiredElementMissing(reason)
        }
        try Task.checkCancellation()
    }

    @MainActor
    private func requireHittable(_ element: XCUIElement, timeout: TimeInterval, _ reason: String) throws {
        try Task.checkCancellation()
        let hittable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "isHittable == true"), object: element)
        guard XCTWaiter().wait(for: [hittable], timeout: timeout) == .completed else {
            throw PreparationError.requiredElementMissing(reason)
        }
        try Task.checkCancellation()
    }

    @MainActor
    private func logIn(username: String = "standard_user", password: String = "secret_sauce") throws {
        let field = page.textFields["Username"]
        try type(username, into: field)
        guard field.value as? String == username else {
            throw PreparationError.requiredElementMissing("Username not entered")
        }
        try type(password, into: page.secureTextFields["Password"])
        page.buttons["Login"].tap()
        dismissSavePasswordPrompt()
    }

    /// Web fields accept typing only once Safari shows the keyboard for them.
    @MainActor
    private func type(_ text: String, into field: XCUIElement) throws {
        field.tap()
        try requireExists(Self.safari.keyboards.firstMatch, timeout: 10, "Keyboard did not appear")
        field.typeText(text)
    }

    /// Safari may offer to save the password after logging in.
    @MainActor
    private func dismissSavePasswordPrompt() {
        let notNow = Self.safari.buttons["Not Now"]
        if notNow.waitForExistence(timeout: 3) { notNow.tap() }
    }
}
#endif
