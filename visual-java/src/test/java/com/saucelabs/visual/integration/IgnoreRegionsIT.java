package com.saucelabs.visual.integration;

import au.com.origin.snapshots.Expect;
import au.com.origin.snapshots.junit5.SnapshotExtension;
import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.By;

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
}
