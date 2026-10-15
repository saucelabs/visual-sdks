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
    func testLoginPageMatchesBaselineByName() async throws {
        try openLoginPage()
        // Compare with testLoginPage's "Login page". Baselines also match on the test name, so override both.
        let options = VisualCheckOptions(baselineOverride: BaselineOverride(name: "Login page", testName: "testLoginPage"))
        try await visual.sauceVisualCheck("Login page (override)", options: options)
    }

    /// Safari isn't the app under test, so the DOM comes from clipping to the web view: its subtree is
    /// Safari's accessibility view of the page.
    @MainActor
    func testLoginPageWithDom() async throws {
        try openLoginPage()
        try await visual.sauceVisualCheck("Login page (DOM)", options: VisualCheckOptions(clipElement: page, captureDom: true))
    }

    @MainActor
    func testLoginButton() async throws {
        try openLoginPage()
        let button = page.buttons["Login"]
        try await visual.sauceVisualCheck("Login button", options: VisualCheckOptions(clipElement: button))
    }

    @MainActor
    func testWrongPasswordShowsError() async throws {
        try openLoginPage()
        try logIn(password: "wrong_password")

        let error = page.staticTexts.containing(NSPredicate(format: "label BEGINSWITH 'Epic sadface'")).firstMatch
        try require(error.waitForExistence(timeout: 10), "No login error shown")
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
        try waitUntilHittable(logout, timeout: 10, "Menu did not open")
        try await visual.sauceVisualCheck("Menu")

        logout.tap()
        try require(page.buttons["Login"].waitForExistence(timeout: 30), "Not logged out")
    }

    // MARK: - Steps
    //
    // Each step throws when it fails, which stops the test before it uploads a snapshot of the wrong page.
    // Don't use `continueAfterFailure = false` instead: in an async test, XCTest stops a failing test by
    // ending the whole test runner, so the SDK never gets to finish the build.

    private struct StepFailed: Error, CustomStringConvertible {
        let description: String
    }

    private func require(_ condition: Bool, _ message: String) throws {
        guard condition else { throw StepFailed(description: message) }
    }

    @MainActor
    private static var safari: XCUIApplication { XCUIApplication(bundleIdentifier: "com.apple.mobilesafari") }

    @MainActor
    private var page: XCUIElement { Self.safari.webViews.firstMatch }

    @MainActor
    private func open(_ url: URL) throws {
        guard #available(iOS 16.4, *) else { throw StepFailed(description: "Opening a URL from a UI test needs iOS 16.4.") }
        Self.safari.open(url)
    }

    @MainActor
    private func openLoginPage() throws {
        try open(Self.site)
        // Wait for the button to be tappable: the fields appear before the page is drawn.
        try waitUntilHittable(page.buttons["Login"], timeout: 60, "Login page did not load")
    }

    /// Reloads the products page after logging in, to undo Safari's zoom into the login fields.
    @MainActor
    private func openProductsPage() throws {
        try logIn()
        try require(page.staticTexts["Products"].waitForExistence(timeout: 30), "Not logged in")
        try open(Self.site.appendingPathComponent("inventory.html"))
        try waitUntilHittable(page.buttons["Open Menu"], timeout: 30, "Products page did not reload")
    }

    @MainActor
    private func waitUntilHittable(_ element: XCUIElement, timeout: TimeInterval, _ message: String) throws {
        let hittable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "isHittable == true"), object: element)
        try require(XCTWaiter().wait(for: [hittable], timeout: timeout) == .completed, message)
    }

    @MainActor
    private func logIn(username: String = "standard_user", password: String = "secret_sauce") throws {
        let field = page.textFields["Username"]
        try type(username, into: field)
        try require(field.value as? String == username, "Username not entered")
        try type(password, into: page.secureTextFields["Password"])
        page.buttons["Login"].tap()
        dismissSavePasswordPrompt()
    }

    /// Safari only accepts typing once the keyboard is showing.
    @MainActor
    private func type(_ text: String, into field: XCUIElement) throws {
        field.tap()
        try require(Self.safari.keyboards.firstMatch.waitForExistence(timeout: 10), "Keyboard did not appear")
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
