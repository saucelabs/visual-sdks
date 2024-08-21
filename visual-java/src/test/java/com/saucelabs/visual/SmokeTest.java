package com.saucelabs.visual;

import com.saucelabs.saucebindings.SaucePlatform;
import com.saucelabs.saucebindings.UnhandledPromptBehavior;
import com.saucelabs.saucebindings.junit5.SauceBaseTest;
import com.saucelabs.saucebindings.options.SauceOptions;
import com.saucelabs.visual.CheckOptions.DiffingMethod;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import com.saucelabs.visual.model.IgnoreRegion;
import java.util.Arrays;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;

@ExtendWith({TestMetaInfoExtension.class})
class SmokeTest extends SauceBaseTest {

  // 2. Create SauceOptions instance with common w3c options
  public SauceOptions createSauceOptions() {
    return SauceOptions.chrome()
        .setPlatformName(SaucePlatform.WINDOWS_10)
        .setUnhandledPromptBehavior(UnhandledPromptBehavior.IGNORE)
        .setScreenResolution("1920x1080")
        .build();
  }

  @Test
  @Disabled
  void testBuildSnapshotAndResults() throws InterruptedException {
    VisualApi visual =
        new VisualApi(
            driver,
            DataCenter.US_WEST_1,
            System.getenv("SAUCE_USERNAME"),
            System.getenv("SAUCE_ACCESS_KEY"));

    driver.get("https://www.saucelabs.com/");

    // Scroll 20 pixels down
    JavascriptExecutor js = (JavascriptExecutor) driver;
    js.executeScript("window.scrollBy(0, 800)");

    Thread.sleep(10000);

    WebElement header = driver.findElement(By.className("css-1orecca"));
    WebElement caroussel = driver.findElement(By.className("css-qijtxs"));
    WebElement cookieBanner = driver.findElement(By.id("onetrust-banner-sdk"));

    CheckOptions checkOptions = new CheckOptions();
    checkOptions.setDiffingMethod(DiffingMethod.BALANCED);
    checkOptions.setIgnoreRegions(
        IgnoreRegion.forElement(driver, Arrays.asList(header, caroussel, cookieBanner)));

    visual.sauceVisualCheck("testCheck", checkOptions);
  }

  @Test
  @Disabled
  void testFullPageOptions() {
    VisualApi visual =
        new VisualApi.Builder(
                driver, System.getenv("SAUCE_USERNAME"), System.getenv("SAUCE_ACCESS_KEY"))
            .withBuild("Full page screenshot with options")
            .build();
    driver.get("https://www.google.com/search?q=duck");
    CheckOptions options = new CheckOptions();
    FullPageScreenshotConfig config =
        new FullPageScreenshotConfig.Builder()
            .withHideScrollBars(false)
            .withScrollLimit(2)
            .withDelayAfterScrollMs(200)
            .withHideAfterFirstScroll("#searchform")
            .build();
    options.enableFullPageScreenshots(config);
    visual.sauceVisualCheck("full page lazy load", options);
  }

  @Test
  @Disabled
  void testFullPageDefaultOptions() {
    VisualApi visual =
        new VisualApi.Builder(
                driver, System.getenv("SAUCE_USERNAME"), System.getenv("SAUCE_ACCESS_KEY"))
            .withBuild("Full page screenshot default options")
            .build();
    driver.get("https://www.google.com/search?q=duck");
    CheckOptions options = new CheckOptions();
    options.enableFullPageScreenshots();
    visual.sauceVisualCheck("full page default", options);
  }
}
