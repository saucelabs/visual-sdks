package com.saucelabs.visual.integration;

import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.VisualApi;
import com.saucelabs.visual.graphql.type.DiffStatus;
import com.saucelabs.visual.graphql.type.IgnoreSelectorIn;
import com.saucelabs.visual.graphql.type.SelectorIn;
import com.saucelabs.visual.graphql.type.SelectorType;
import dev.failsafe.Failsafe;
import dev.failsafe.RetryPolicy;
import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
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

  @BeforeAll
  public static void setUp() throws MalformedURLException {
    MutableCapabilities caps = new MutableCapabilities();
    caps.setCapability("browserName", "firefox");
    caps.setCapability("browserVersion", "latest");
    caps.setCapability("platformName", "Windows 10");
    Map<String, Object> sauceOptions = new HashMap<>();
    sauceOptions.put("screenResolution", "1600x1200");
    caps.setCapability("sauce:options", sauceOptions);
    driver = isLocal ? new FirefoxDriver() : new RemoteWebDriver(getDriverUrl(), caps);
    driver.manage().window().setSize(new Dimension(1400, 1100));
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

  private String getSnapshotResultInternal(String snapshotId) {
    CheckSnapshotOperation.Result result =
        visual.execute(new CheckSnapshotOperation(snapshotId), CheckSnapshotOperation.Result.class);

    String data = result.data;
    DiffStatus status = result.status;

    if (status.equals(DiffStatus.QUEUED)) {
      throw new RuntimeException("Diff still in queued status.");
    }

    return data;
  }

  protected String getSnapshotResult(String snapshotId) {
    RetryPolicy<Object> retryPolicy =
        RetryPolicy.builder()
            .handle(RuntimeException.class)
            .withBackoff(Duration.ofMillis(100), Duration.ofSeconds(120))
            .withMaxRetries(10)
            .build();

    return Failsafe.with(retryPolicy).get(() -> getSnapshotResultInternal(snapshotId));
  }

  protected static class InventoryLongPage {
    public void open() {
      driver.get("https://www.saucedemo.com/inventory-long.html");
    }
  }
}
