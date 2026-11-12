package com.saucelabs.visual.integration;

import au.com.origin.snapshots.Expect;
import au.com.origin.snapshots.junit5.SnapshotExtension;
import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import java.time.Duration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

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
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void clipToElementOnThePage() {
    String id =
        sauceVisualCheck(
            "Clipped element",
            new CheckOptions.Builder()
                .withClipElement(driver.findElement(By.cssSelector(".inventory_list")))
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void hideElementsOverlappingClipElement() throws InterruptedException {
    driver.findElement(By.cssSelector("button#react-burger-menu-btn")).click();
    Thread.sleep(1000);

    String id =
        sauceVisualCheck(
            "Clipped element with overlapping menu",
            new CheckOptions.Builder()
                .withClipSelector("[data-test='inventory-item']:nth-child(1)")
                .withFullPageConfig(new FullPageScreenshotConfig.Builder().build())
                .build());
    String result = getSnapshotResult(id);

    driver.findElement(By.cssSelector("button#react-burger-cross-btn")).click();
    Thread.sleep(1000);

    expect.toMatchSnapshot(result);
  }

  @Test
  public void scrollBeforeAndAfterClipping() {
    driver.executeScript("window.scrollTo(0, 200)");

    String idBefore =
        sauceVisualCheck(
            "Scroll to element before clipping",
            new CheckOptions.Builder()
                .withClipElement(
                    driver.findElement(By.cssSelector(".inventory_item:nth-child(21)")))
                .build());
    String resultBefore = getSnapshotResult(idBefore);

    String idAfter =
        sauceVisualCheck(
            "Scroll to previous position after clipping", new CheckOptions.Builder().build());
    String resultAfter = getSnapshotResult(idAfter);

    expect.scenario("clipped").toMatchSnapshot(resultBefore);
    expect.scenario("restored").toMatchSnapshot(resultAfter);
  }
}
