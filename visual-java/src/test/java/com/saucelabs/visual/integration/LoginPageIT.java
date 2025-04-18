package com.saucelabs.visual.integration;

import com.saucelabs.saucebindings.SaucePlatform;
import com.saucelabs.saucebindings.UnhandledPromptBehavior;
import com.saucelabs.saucebindings.junit5.SauceBaseTest;
import com.saucelabs.saucebindings.options.SauceOptions;
import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.VisualApi;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import com.saucelabs.visual.model.DiffingMethodSensitivity;
import com.saucelabs.visual.model.DiffingMethodTolerance;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.By;

@ExtendWith({TestMetaInfoExtension.class})
class LoginPageIT extends SauceBaseTest {
  VisualApi visual;

  public SauceOptions createSauceOptions() {
    return SauceOptions.chrome()
        .setPlatformName(SaucePlatform.WINDOWS_10)
        .setUnhandledPromptBehavior(UnhandledPromptBehavior.IGNORE)
        .setScreenResolution("1920x1080")
        .build();
  }

  @BeforeEach
  public void setup() {
    visual =
        new VisualApi(driver, System.getenv("SAUCE_USERNAME"), System.getenv("SAUCE_ACCESS_KEY"));
    driver.get("https://www.saucedemo.com");
  }

  @Test
  void checkLoginPage() {
    visual.sauceVisualCheck(
        "Login page",
        new CheckOptions.Builder()
            .withClipElement(
                driver.findElement(By.cssSelector("input[data-test=\"login-button\"]")))
            .build());
    System.out.println("Sauce Visual: " + visual.getBuild().getUrl());
  }

  @Test
  void checkDiffingSettings() {
    visual.sauceVisualCheck(
        "Login page",
        new CheckOptions.Builder()
            .withDiffingMethodSensitivity(DiffingMethodSensitivity.LOW)
            .withDiffingMethodTolerance(
                DiffingMethodTolerance.builder()
                    .withColor(.05)
                    .withAntiAliasing(0.5)
                    .withBrightness(2.5)
                    .withMinChangeSize(3)
                    .build())
            .withClipElement(
                driver.findElement(By.cssSelector("input[data-test=\"login-button\"]")))
            .build());
    System.out.println("Sauce Visual: " + visual.getBuild().getUrl());
  }
}
