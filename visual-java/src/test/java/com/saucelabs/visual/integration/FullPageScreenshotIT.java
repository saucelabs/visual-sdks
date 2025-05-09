package com.saucelabs.visual.integration;

import au.com.origin.snapshots.Expect;
import au.com.origin.snapshots.junit5.SnapshotExtension;
import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith({TestMetaInfoExtension.class, SnapshotExtension.class})
public class FullPageScreenshotIT extends IntegrationBase {
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
  public void takeAFPSWithDefaultSettings() {
    String id =
        sauceVisualCheck(
            "FPS",
            new CheckOptions.Builder().withFullPageConfig(new FullPageScreenshotConfig()).build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void takeAFPSAndDisplayScrollBars() {
    String id =
        sauceVisualCheck(
            "FPS hideScrollBars=false",
            new CheckOptions.Builder()
                .withHideScrollBars(false)
                .withFullPageConfig(new FullPageScreenshotConfig())
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void takeAFPSWithScrollLimit() {
    String id =
        sauceVisualCheck(
            "FPS scrollLimit=1",
            new CheckOptions.Builder()
                .withHideScrollBars(true)
                .withFullPageConfig(new FullPageScreenshotConfig())
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }
}
