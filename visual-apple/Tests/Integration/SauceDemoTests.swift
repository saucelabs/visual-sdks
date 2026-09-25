#if os(iOS)
import Foundation
import XCTest
import SauceVisual

/// Logs in to saucedemo.com in Safari and logs out again, while a Sauce Visual build is open.
/// Uses the site's public demo account. iOS only: tvOS has no Safari.
final class SauceDemoTests: XCTestCase, @unchecked Sendable {
    @MainActor
    func testLoginAndLogoutInSafari() async throws {
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        let build = try await VisualClient().build()
        XCTAssertNotNil(UUID(uuidString: build.id))

        guard #available(iOS 16.4, *) else { return XCTFail("Opening a URL from a UI test needs iOS 16.4.") }
        safari.open(URL(string: "https://www.saucedemo.com")!)
        let page = safari.webViews.firstMatch

        let username = page.textFields["Username"]
        XCTAssertTrue(username.waitForExistence(timeout: 60), "Login page did not load")
        type("standard_user", into: username, in: safari)
        XCTAssertEqual(username.value as? String, "standard_user", "Username not entered")
        type("secret_sauce", into: page.secureTextFields["Password"], in: safari)
        page.buttons["Login"].tap()
        dismissSavePasswordPrompt(in: safari)

        XCTAssertTrue(page.staticTexts["Products"].waitForExistence(timeout: 30), "Not logged in")

        page.buttons["Open Menu"].tap()
        // Safari exposes the menu item as a button once the menu has slid in.
        let logout = page.buttons["Logout"]
        let opened = expectation(for: NSPredicate(format: "isHittable == true"), evaluatedWith: logout)
        await fulfillment(of: [opened], timeout: 10)
        logout.tap()

        XCTAssertTrue(page.buttons["Login"].waitForExistence(timeout: 30), "Not logged out")
        safari.terminate()
    }

    /// Web fields accept typing only once Safari shows the keyboard for them.
    @MainActor
    private func type(_ text: String, into field: XCUIElement, in safari: XCUIApplication) {
        field.tap()
        XCTAssertTrue(safari.keyboards.firstMatch.waitForExistence(timeout: 10), "Keyboard did not appear")
        field.typeText(text)
    }

    /// Safari may offer to save the password after logging in.
    @MainActor
    private func dismissSavePasswordPrompt(in safari: XCUIApplication) {
        let notNow = safari.buttons["Not Now"]
        if notNow.waitForExistence(timeout: 3) { notNow.tap() }
    }
}
#endif
