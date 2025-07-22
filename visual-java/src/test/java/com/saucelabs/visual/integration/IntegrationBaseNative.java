package com.saucelabs.visual.integration;

import com.saucelabs.visual.VisualApi;
import io.appium.java_client.AppiumBy;
import io.appium.java_client.ios.IOSDriver;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebDriver;

public class IntegrationBaseNative {
  protected static final String username = System.getenv("SAUCE_USERNAME");
  protected static final String accessKey = System.getenv("SAUCE_ACCESS_KEY");
  protected static RemoteWebDriver driver;
  protected static VisualApi visual;

  @BeforeAll
  public static void setUp() throws MalformedURLException {
    MutableCapabilities caps = new MutableCapabilities();
    caps.setCapability("platformName", "iOS");
    caps.setCapability("appium:deviceName", "iPhone Simulator");
    caps.setCapability("appium:platformVersion", "17.5");
    caps.setCapability("appium:automationName", "XCUITest");
    caps.setCapability("appium:app", "storage:filename=visual-sdks-ios-simulator.ipa");
    Map<String, Object> sauceOptions = new HashMap<>();
    sauceOptions.put("appiumVersion", "2.1.3");
    sauceOptions.put("armRequired", true);
    sauceOptions.put("name", "visual-sdks java-integration-test");
    sauceOptions.put("deviceOrientation", "PORTRAIT");
    caps.setCapability("sauce:options", sauceOptions);
    driver = new IOSDriver(getDriverUrl(), caps);
    visual =
        new VisualApi.Builder(driver, username, accessKey)
            .withBuild("Java integration tests")
            .withProject("visual-java-integration")
            .withCaptureDom(true)
            .build();
  }

  @AfterAll
  public static void tearDown() {
    driver.quit();
  }

  static URL getDriverUrl() throws MalformedURLException {
    if (username == null
        || accessKey == null
        || username.trim().isEmpty()
        || accessKey.trim().isEmpty()) {
      String err =
          "Sauce Labs credentials not found. Please set SAUCE_USERNAME and SAUCE_ACCESS_KEY in your environment";
      throw new RuntimeException(err);
    }
    String dataCenter = Optional.ofNullable(System.getenv("SAUCE_REGION")).orElse("us-west-1");
    return new URL(
        "https://"
            + username
            + ":"
            + accessKey
            + "@ondemand."
            + (dataCenter.isEmpty() ? "us-west-1" : dataCenter)
            + ".saucelabs.com:443/wd/hub");
  }

  protected static class MenuPage {
    public WebElement getLoginButton() {
      return driver.findElement(AppiumBy.accessibilityId("LogOut-menu-item"));
    }

    public WebElement getMenuButton() {
      return driver.findElement(AppiumBy.accessibilityId("More-tab-item"));
    }

    public void open() {
      getMenuButton().click();
    }

    public void clickLoginButton() {
      getLoginButton().click();
    }
  }

  protected static class LoginPage {
    public WebElement getBobUserButton() {
      return driver.findElement(AppiumBy.accessibilityId("bob@example.com"));
    }

    public WebElement getVisualUserButton() {
      return driver.findElement(AppiumBy.accessibilityId("visual@example.com"));
    }

    public WebElement getLoginButton() {
      return driver.findElement(AppiumBy.accessibilityId("Login"));
    }

    public void clickBobUserButton() {
      getBobUserButton().click();
    }

    public void clickVisualUserButton() {
      getVisualUserButton().click();
    }

    public void clickLoginButton() {
      getLoginButton().click();
    }
  }

  protected static class CatalogPage {

    public List<WebElement> getProductImages() {
      return driver.findElements(AppiumBy.accessibilityId("Product Image"));
    }

    public List<WebElement> getVisibleProductPrices() {
      return driver.findElements(AppiumBy.accessibilityId("Product Price")).subList(0, 4);
    }

    public WebElement getCatalogContent() {
      return driver.findElement(
          AppiumBy.xpath(
              "//XCUIElementTypeOther[@name=\"Catalog-screen\"]/XCUIElementTypeOther[2]"));
    }

    public WebElement getFullPageCatalog() {
      return driver.findElement(AppiumBy.xpath("//XCUIElementTypeCollectionView"));
    }
  }
}
