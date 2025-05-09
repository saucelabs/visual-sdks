package com.saucelabs.visual.integration;

import au.com.origin.snapshots.Expect;
import au.com.origin.snapshots.junit5.SnapshotExtension;
import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.By;

@ExtendWith({TestMetaInfoExtension.class, SnapshotExtension.class})
public class ClippingIT extends IntegrationBase {
  Expect expect;

  @BeforeAll
  public static void login() {
    LoginPage loginPage = new LoginPage();
    loginPage.open();
    loginPage.login();
    InventoryLongPage inventoryPage = new InventoryLongPage();
    inventoryPage.open();
  }

  @Test
  public void clipToSelectorOnThePage() {
    String id =
        sauceVisualCheck(
            "Clipped selector",
            new CheckOptions.Builder().withClipSelector(".inventory_list").build());
    CheckSnapshotOperation.Result result = getSnapshotResult(id);
    expect.toMatchSnapshot(result.data);
  }

  @Test
  public void clipToElementOnThePage() {
    String id =
        sauceVisualCheck(
            "Clipped element",
            new CheckOptions.Builder()
                .withClipElement(driver.findElement(By.cssSelector(".inventory_list")))
                .build());
    CheckSnapshotOperation.Result result = getSnapshotResult(id);
    expect.toMatchSnapshot(result.data);
  }

  @Test
  public void scrollToElementBeforeClipping() {
    String id =
        sauceVisualCheck(
            "Scroll to element before clipping",
            new CheckOptions.Builder()
                .withClipElement(
                    driver.findElement(By.cssSelector(".inventory_item:nth-child(21)")))
                .build());
    CheckSnapshotOperation.Result result = getSnapshotResult(id);
    expect.toMatchSnapshot(result.data);
  }
}
