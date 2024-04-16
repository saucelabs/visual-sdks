package com.saucelabs.visual.integration;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.remote.RemoteWebDriver;
import com.saucelabs.visual.pageobjects.InventoryPage;
import com.saucelabs.visual.pageobjects.LoginPage;

import java.net.MalformedURLException;

import com.saucelabs.visual.VisualApi;

public class LoginPageIT {
    private static final String region = System.getenv("SAUCE_REGION");
    private static final String username = System.getenv("SAUCE_USERNAME");
    private static final String accessKey = System.getenv("SAUCE_ACCESS_KEY");
    private static final String uniqIdentifier = System.getenv("UNIQ_IDENTIFIER");

    private static VisualApi visual;
    private static RemoteWebDriver driver;

    @BeforeAll
    public static void init() throws MalformedURLException {
        driver = TestUtils.getWebDriver(region, username, accessKey);
        visual = TestUtils.getVisualApi(driver, region, username, accessKey);
    }

    @Test
    void checkLoginPage() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.open();

        visual.sauceVisualCheck("Login page" + uniqIdentifier);
    }

    @AfterAll
    public static void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
