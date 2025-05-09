package com.saucelabs.visual.integration;

import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.VisualApi;
import com.saucelabs.visual.graphql.type.IgnoreSelectorIn;
import com.saucelabs.visual.graphql.type.SelectorIn;
import com.saucelabs.visual.graphql.type.SelectorType;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.openqa.selenium.By;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.remote.RemoteWebDriver;

abstract class IntegrationBase {
  private static final String username = System.getenv("SAUCE_USERNAME");
  private static final String accessKey = System.getenv("SAUCE_ACCESS_KEY");
  protected static RemoteWebDriver driver;
  protected static VisualApi visual;
  protected static boolean isLocal = Objects.equals(System.getenv("RUN_ON"), "local");

  private static URL getDriverUrl() throws MalformedURLException {
    if (username == null
        || accessKey == null
        || username.trim().isEmpty()
        || accessKey.trim().isEmpty()) {
      String err =
          "Sauce Labs credentials not found. Please set SAUCE_USERNAME and SAUCE_ACCESS_KEY in your environment";
      throw new RuntimeException(err);
    }
    String dataCenter = System.getenv("SAUCE_REGION");
    return new URL(
        "https://"
            + username
            + ":"
            + accessKey
            + "@ondemand."
            + (dataCenter.isEmpty() ? "us-west-1" : dataCenter)
            + ".saucelabs.com:443/wd/hub");
  }

  @BeforeAll
  public static void setUp() throws MalformedURLException {
    MutableCapabilities caps = new MutableCapabilities();
    caps.setCapability("browserName", "chrome");
    caps.setCapability("browserVersion", "latest");
    caps.setCapability("platformName", "Windows 10");
    Map<String, Object> sauceOptions = new HashMap<>();
    sauceOptions.put("screenResolution", "1600x1200");
    caps.setCapability("sauce:options", sauceOptions);
    driver = isLocal ? new FirefoxDriver() : new RemoteWebDriver(getDriverUrl(), caps);
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

  protected void sauceVisualCheck(String name) {
    sauceVisualCheck(name, new CheckOptions());
  }

  protected String sauceVisualCheck(String name, CheckOptions checkOptions) {
    String postfix = isLocal ? "Local" : "Sauce";
    return visual.sauceVisualCheck(String.format("%s (%s)", name, postfix), checkOptions);
  }

  protected List<IgnoreSelectorIn> stringSelectorsToInput(String... values) {
    return Stream.of(values)
        .map(
            sel ->
                new IgnoreSelectorIn.Builder()
                    .withSelector(
                        SelectorIn.builder().withType(SelectorType.XPATH).withValue(sel).build())
                    .build())
        .collect(Collectors.toList());
  }

  protected static class LoginPage {

    public void open() {
      driver.get("https://www.saucedemo.com/");
    }

    public WebElement getInputUsername() {
      return driver.findElement(By.id("user-name"));
    }

    public WebElement getInputPassword() {
      return driver.findElement(By.id("password"));
    }

    public WebElement getBtnSubmit() {
      return driver.findElement(By.cssSelector("input[type=\"submit\"]"));
    }

    public void login() {
      String username = "standard_user";
      if (System.getProperty("modified") != null) {
        username = "visual_user";
      }

      getInputUsername().sendKeys(username);
      getInputPassword().sendKeys("secret_sauce");
      getBtnSubmit().click();
    }
  }

  protected CheckSnapshotOperation.Result getSnapshotResult(String snapshotId) {
    return visual.execute(
        new CheckSnapshotOperation(snapshotId), CheckSnapshotOperation.Result.class);
  }

  protected static class InventoryLongPage {
    public void open() {
      driver.get("https://www.saucedemo.com/inventory-long.html");
    }
  }
}
