package com.saucelabs.visual.integration;

import au.com.origin.snapshots.Expect;
import au.com.origin.snapshots.junit5.SnapshotExtension;
import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import com.saucelabs.visual.model.DiffingFlag;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import java.util.EnumSet;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

@ExtendWith({TestMetaInfoExtension.class, SnapshotExtension.class})
public class IgnoreRegionsIT extends IntegrationBase {
  Expect expect;

  @BeforeAll
  public static void login() {
    LoginPage loginPage = new LoginPage();
    loginPage.open();
    loginPage.login();
    InventoryLongPage inventoryPage = new InventoryLongPage();
    inventoryPage.open();
    driver.executeScript("window.scrollTo(0, 0)");
  }

  final By ignoreSelectors = By.cssSelector(".inventory_item_img,.btn_inventory");

  @Test
  public void checkDefaultStandardIgnoreRegions() {
    String id =
        sauceVisualCheck(
            "Standard",
            new CheckOptions.Builder()
                .withIgnoreElements(driver.findElements(ignoreSelectors))
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void checkPositionRegionsWhenScrolledPrior() {
    driver.executeScript("window.scrollBy(0, 100)");

    String id =
        sauceVisualCheck(
            "Standard (scrolled)",
            new CheckOptions.Builder()
                .withIgnoreElements(driver.findElements(ignoreSelectors))
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void checkPositionRegionsOnClippedSnapshot() {
    String id =
        sauceVisualCheck(
            "Clipped",
            new CheckOptions.Builder()
                .withClipElement(driver.findElement(By.cssSelector(".inventory_list")))
                .withIgnoreElements(driver.findElements(ignoreSelectors))
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void checkPositionRegionsWhenScrolledPriorToClip() {
    driver.executeScript("window.scrollBy(0, 100)");

    String id =
        sauceVisualCheck(
            "Clipped (scrolled)",
            new CheckOptions.Builder()
                .withClipElement(driver.findElement(By.cssSelector(".inventory_list")))
                .withIgnoreElements(driver.findElements(ignoreSelectors))
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void checkPositionRegionsOnFPS() {
    String id =
        sauceVisualCheck(
            "FPS",
            new CheckOptions.Builder()
                .withFullPageConfig(new FullPageScreenshotConfig.Builder().build())
                .withIgnoreElements(driver.findElements(ignoreSelectors))
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void checkPositionRegionsOnFPSWhenClipped() {
    String id =
        sauceVisualCheck(
            "Clipped (FPS)",
            new CheckOptions.Builder()
                .withFullPageConfig(new FullPageScreenshotConfig.Builder().build())
                .withIgnoreElements(driver.findElements(ignoreSelectors))
                .withClipElement(driver.findElement(By.cssSelector(".inventory_list")))
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void checkPositionRegionsOnFPSWhenScrolledPriorToClip() {
    driver.executeScript("window.scrollBy(0, 100)");

    String id =
        sauceVisualCheck(
            "FPS (scrolled)",
            new CheckOptions.Builder()
                .withFullPageConfig(new FullPageScreenshotConfig.Builder().build())
                .withIgnoreElements(driver.findElements(ignoreSelectors))
                .withClipElement(driver.findElement(By.cssSelector(".inventory_list")))
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void checkAbilityToUseSelectiveRegion() {
    EnumSet<DiffingFlag> contentChanges = EnumSet.of(DiffingFlag.Content);
    List<WebElement> elements = driver.findElements(By.cssSelector(".inventory_item_desc"));

    CheckOptions.Builder options =
        new CheckOptions.Builder()
            .withIgnoreElements(driver.findElements(By.cssSelector(".btn_inventory")))
            .withFullPageConfig(new FullPageScreenshotConfig.Builder().build());

    for (WebElement element : elements) {
      options.disableOnly(contentChanges, element);
    }

    String id = sauceVisualCheck("Standard Selective Regions", options.build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }
}
