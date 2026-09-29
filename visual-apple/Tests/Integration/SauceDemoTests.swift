#if os(iOS)
import Foundation
import XCTest
import SauceVisual

/// Snapshots saucedemo.com in Safari, one flow per test, with the site's public demo account.
/// iOS only, because tvOS has no Safari.
final class SauceDemoTests: XCTestCase, @unchecked Sendable {
    private static let site = URL(string: "https://www.saucedemo.com")!

    /// One client for the whole class. Missing credentials fail each test instead of crashing the run.
    private static let client = Result { try VisualClient() }
    private var visual: VisualClient { get throws { try Self.client.get() } }

    override func setUp() {
        // Stop at the first failure, so no test uploads a snapshot of the wrong page.
        continueAfterFailure = false
    }

    override func tearDown() async throws {
        await MainActor.run { Self.safari.terminate() }
    }

    @MainActor
    func testLoginPage() async throws {
        openLoginPage()

        let snapshot = try await visual.sauceVisualCheck("Login page")
        XCTAssertNotNil(UUID(uuidString: snapshot.buildId))
        XCTAssertEqual(snapshot.suiteName, "SauceDemoTests")
        XCTAssertEqual(snapshot.testName, "testLoginPage")
    }

    @MainActor
    func testWrongPasswordShowsError() async throws {
        openLoginPage()
        logIn(password: "wrong_password")

        let error = page.staticTexts.containing(NSPredicate(format: "label BEGINSWITH 'Epic sadface'")).firstMatch
        XCTAssertTrue(error.waitForExistence(timeout: 10), "No login error shown")
        try await visual.sauceVisualCheck("Login error")
    }

    @MainActor
    func testLoginShowsProducts() async throws {
        openLoginPage()
        openProductsPage()
        // Product descriptions change, so leave the first one out of the comparison.
        let description = page.staticTexts.containing(NSPredicate(format: "label BEGINSWITH 'carry.allTheThings()'")).firstMatch
        try await visual.sauceVisualCheck("Products page", options: VisualCheckOptions(ignoreElements: [description]))
    }

    @MainActor
    func testMenuLogsOut() async throws {
        openLoginPage()
        openProductsPage()

        page.buttons["Open Menu"].tap()
        // The menu item becomes tappable once the menu has slid in.
        let logout = page.buttons["Logout"]
        let opened = expectation(for: NSPredicate(format: "isHittable == true"), evaluatedWith: logout)
        await fulfillment(of: [opened], timeout: 10)
        try await visual.sauceVisualCheck("Menu")

        logout.tap()
        XCTAssertTrue(page.buttons["Login"].waitForExistence(timeout: 30), "Not logged out")
    }

    // MARK: - Steps

    @MainActor
    private static var safari: XCUIApplication { XCUIApplication(bundleIdentifier: "com.apple.mobilesafari") }

    @MainActor
    private var page: XCUIElement { Self.safari.webViews.firstMatch }

    @MainActor
    private func open(_ url: URL) {
        guard #available(iOS 16.4, *) else { return XCTFail("Opening a URL from a UI test needs iOS 16.4.") }
        Self.safari.open(url)
    }

    @MainActor
    private func openLoginPage() {
        open(Self.site)
        // Wait for the button to be tappable: the fields appear before the page is drawn.
        waitUntilHittable(page.buttons["Login"], timeout: 60, "Login page did not load")
    }

    /// Reloads the products page after logging in, to undo Safari's zoom into the login fields.
    @MainActor
    private func openProductsPage() {
        logIn()
        XCTAssertTrue(page.staticTexts["Products"].waitForExistence(timeout: 30), "Not logged in")
        open(Self.site.appendingPathComponent("inventory.html"))
        waitUntilHittable(page.buttons["Open Menu"], timeout: 30, "Products page did not reload")
    }

    @MainActor
    private func waitUntilHittable(_ element: XCUIElement, timeout: TimeInterval, _ message: String) {
        let hittable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "isHittable == true"), object: element)
        XCTAssertEqual(XCTWaiter().wait(for: [hittable], timeout: timeout), .completed, message)
    }

    @MainActor
    private func logIn(username: String = "standard_user", password: String = "secret_sauce") {
        let field = page.textFields["Username"]
        type(username, into: field)
        XCTAssertEqual(field.value as? String, username, "Username not entered")
        type(password, into: page.secureTextFields["Password"])
        page.buttons["Login"].tap()
        dismissSavePasswordPrompt()
    }

    /// Safari only accepts typing once the keyboard is showing.
    @MainActor
    private func type(_ text: String, into field: XCUIElement) {
        field.tap()
        XCTAssertTrue(Self.safari.keyboards.firstMatch.waitForExistence(timeout: 10), "Keyboard did not appear")
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
