package com.saucelabs.visual.integration;

import com.saucelabs.saucebindings.SaucePlatform;
import com.saucelabs.saucebindings.UnhandledPromptBehavior;
import com.saucelabs.saucebindings.junit5.SauceBaseTest;
import com.saucelabs.saucebindings.options.SauceOptions;
import com.saucelabs.visual.DataCenter;
import com.saucelabs.visual.VisualApi;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith({TestMetaInfoExtension.class})
class LoginPageIT extends SauceBaseTest {

  public SauceOptions createSauceOptions() {
    return SauceOptions.chrome()
        .setPlatformName(SaucePlatform.WINDOWS_10)
        .setUnhandledPromptBehavior(UnhandledPromptBehavior.IGNORE)
        .setScreenResolution("1920x1080")
        .build();
  }

  @Test
  void checkLoginPage() {
    VisualApi visual =
        new VisualApi(
            driver,
            DataCenter.US_WEST_1,
            System.getenv("SAUCE_USERNAME"),
            System.getenv("SAUCE_ACCESS_KEY"));
    driver.get("https://www.saucedemo.com");
    visual.sauceVisualCheck("Login page");
    System.out.println("Sauce Visual: " + visual.getBuild().getUrl());
  }
}
