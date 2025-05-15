package com.saucelabs.visual.integration;

import au.com.origin.snapshots.Expect;
import au.com.origin.snapshots.junit5.SnapshotExtension;
import com.saucelabs.visual.CheckOptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith({SnapshotExtension.class})
public class WithoutTestMetaIT extends IntegrationBase {
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
  public void checkWithoutTestMeta() {
    String id = sauceVisualCheck("No Test Meta");
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }

  @Test
  public void checkSupplyingValuesManually() {
    String id =
        sauceVisualCheck(
            "Manual Test Meta",
            new CheckOptions.Builder()
                .withSuiteName("Custom Suite Name")
                .withTestName("Custom Test Name")
                .build());
    String result = getSnapshotResult(id);
    expect.toMatchSnapshot(result);
  }
}
