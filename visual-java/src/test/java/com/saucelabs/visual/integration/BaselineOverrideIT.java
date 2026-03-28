package com.saucelabs.visual.integration;

import au.com.origin.snapshots.Expect;
import au.com.origin.snapshots.junit5.SnapshotExtension;
import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.VisualApi;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import com.saucelabs.visual.model.BaselineOverride;
import com.saucelabs.visual.model.Browser;
import com.saucelabs.visual.model.OperatingSystem;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith({TestMetaInfoExtension.class, SnapshotExtension.class})
public class BaselineOverrideIT extends IntegrationBase {
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

  @Test
  public void testNullBaselineOverride() {
    String id =
        sauceVisualCheck("Standard", new CheckOptions.Builder().withBaselineOverride(null).build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void testIncludeBaselineOverrides() {
    String id =
        sauceVisualCheck(
            "Set on snapshot level",
            new CheckOptions.Builder()
                .withBaselineOverride(
                    new BaselineOverride.Builder()
                        .withBrowser(Browser.CHROME)
                        .withOperatingSystem(OperatingSystem.MACOS)
                        .withDevice("Device")
                        .withBrowserVersion("130")
                        .withTestName("testIncludeBaselineOverrides")
                        .withSuiteName("BaselineOverrideIT")
                        .withOperatingSystemVersion("17")
                        .build())
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void testIncludeBaselineOverridesWithNullValues() {
    String id =
        sauceVisualCheck(
            "Set with null values",
            new CheckOptions.Builder()
                .withBaselineOverride(
                    new BaselineOverride.Builder()
                        .withBrowser(null)
                        .withOperatingSystem(null)
                        .withDevice(null)
                        .withBrowserVersion(null)
                        .withTestName(null)
                        .withSuiteName(null)
                        .withOperatingSystemVersion(null)
                        .build())
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void testSetAtBuildLevel() {
    visual =
        new VisualApi.Builder(driver, username, accessKey)
            .withBuild("Java integration tests")
            .withProject("visual-java-integration")
            .withBaselineOverride(
                new BaselineOverride.Builder().withOperatingSystemVersion("130").build())
            .build();

    String id = sauceVisualCheck("Set at build level");
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }
}
