package com.saucelabs.visual.integration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.VisualApi;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import com.saucelabs.visual.model.BaselineOverride;
import com.saucelabs.visual.model.Browser;
import com.saucelabs.visual.model.OperatingSystem;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith({TestMetaInfoExtension.class})
public class BaselineOverrideIT extends IntegrationBase {
  ObjectMapper mapper = new ObjectMapper();

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
  public void testNullBaselineOverride() throws JsonProcessingException {
    String id =
        sauceVisualCheck("Standard", new CheckOptions.Builder().withBaselineOverride(null).build());
    String result = getSnapshotResult(id);
    assertEquals(
        mapper.readTree("null"),
        mapper.readTree(result).at("/snapshot/metadata")
    );
  }

  @Test
  public void testIncludeBaselineOverrides() throws JsonProcessingException {
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
    assertEquals(
        mapper.readTree("{" +
            "\"device\" : \"Device\"," +
            " \"browser\" : \"CHROME\"," +
            " \"testName\" : \"testIncludeBaselineOverrides\"," +
            " \"suiteName\" : \"BaselineOverrideIT\"," +
            " \"browserVersion\" : \"130\"," +
            " \"operatingSystem\" : \"MACOS\"," +
            " \"operatingSystemVersion\" : \"17\"" +
            "}"),
        mapper.readTree(result).at("/snapshot/metadata/baselineOverride")
    );
  }

  @Test
  public void testIncludeBaselineOverridesWithNullValues() throws JsonProcessingException {
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
    assertEquals(
        mapper.readTree("{" +
            "\"device\": null," +
            " \"browser\": null," +
            " \"testName\": null," +
            " \"suiteName\": null," +
            " \"browserVersion\": null," +
            " \"operatingSystem\": null," +
            " \"operatingSystemVersion\": null" +
            "}"),
        mapper.readTree(result).at("/snapshot/metadata/baselineOverride")
    );
  }

  @Test
  public void testSetAtBuildLevel() throws JsonProcessingException {
    visual =
        new VisualApi.Builder(driver, username, accessKey)
            .withBuild("Java integration tests")
            .withProject("visual-java-integration")
            .withBaselineOverride(
                new BaselineOverride.Builder().withOperatingSystemVersion("130").build())
            .build();

    String id = sauceVisualCheck("Set at build level");
    String result = getSnapshotResult(id);
    assertEquals(
        mapper.readTree("{\"operatingSystemVersion\": \"130\"}"),
        mapper.readTree(result).at("/snapshot/metadata/baselineOverride")
    );
  }
}
