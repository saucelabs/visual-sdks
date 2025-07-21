package com.saucelabs.visual.integration;

import com.saucelabs.visual.CheckOptions;
import com.saucelabs.visual.junit5.TestMetaInfoExtension;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.WebElement;

@ExtendWith({TestMetaInfoExtension.class})
public class IosIT extends IntegrationBaseNative {
  @Test
  void checkAppCatalog() {
    visual.sauceVisualCheck("Startup");

    MenuPage menuPage = new MenuPage();
    menuPage.open();
    menuPage.clickLoginButton();

    LoginPage loginPage = new LoginPage();
    loginPage.clickBobUserButton();
    loginPage.clickLoginButton();

    CatalogPage catalogPage = new CatalogPage();

    WebElement firstImage = catalogPage.getProductImages().get(0);
    List<WebElement> prices = catalogPage.getVisibleProductPrices();
    List<WebElement> ignore = new ArrayList<>();
    ignore.add(firstImage);
    ignore.addAll(prices);

    visual.sauceVisualCheck(
        "App Catalog", new CheckOptions.Builder().withIgnoreElements(ignore).build());
  }
}
