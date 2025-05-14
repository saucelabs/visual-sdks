package com.saucelabs.visual.utils;

import com.saucelabs.visual.exception.InvalidSelectorException;
import com.saucelabs.visual.graphql.type.SelectorIn;
import java.util.*;
import org.openqa.selenium.*;

public class BulkDriverHelper {
  private final JavascriptExecutor driver;

  public BulkDriverHelper(JavascriptExecutor javascriptExecutor) {
    this.driver = javascriptExecutor;
  }

  public List<Rectangle> getRects(List<WebElement> elements) {
    final String script =
        "return Array.from(arguments[0]).map(function (element) {"
            + "  if (!element) throw new Error('element cannot be null');"
            + "  const rect = element.getBoundingClientRect();"
            + "  return {"
            + "    width: Math.round(rect.width),"
            + "    height: Math.round(rect.height),"
            + "    x: Math.round(rect.x + this.window.scrollX),"
            + "    y: Math.round(rect.y + this.window.scrollY)"
            + "  };"
            + "});";

    List<Map<String, Long>> jsResult =
        (List<Map<String, Long>>) driver.executeScript(script, elements);
    List<Rectangle> result = new ArrayList<>();

    for (int i = 0; i < elements.size(); i++) {
      Map<String, Long> jsRect = jsResult.get(i);

      int width = jsRect.get("width").intValue();
      int height = jsRect.get("height").intValue();
      int x = jsRect.get("x").intValue();
      int y = jsRect.get("y").intValue();

      result.add(new Rectangle(x, y, height, width));
    }

    return result;
  }

  public List<Boolean> areDisplayed(List<WebElement> elements) {
    final String script =
        "return Array.from(arguments[0]).map(function (element) {"
            + "  if (!element) throw new Error('element cannot be null');"
            + "  return element.checkVisibility();"
            + "});";

    return (List<Boolean>) driver.executeScript(script, elements);
  }

  public List<WebElement> resolveElements(List<SelectorIn> selectors) {
    final String script =
        "return Array.from(arguments[0]).map(function (xpath) {"
            + "  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)"
            + "    .singleNodeValue"
            + "});";

    List<String> xpaths = new ArrayList<>();

    for (SelectorIn selector : selectors) {
      switch (selector.getType()) {
        case XPATH:
          xpaths.add(selector.getValue());
          break;
        default:
          throw new InvalidSelectorException(selector, "Unsupported selector type");
      }
    }

    return (List<WebElement>) driver.executeScript(script, xpaths);
  }
}
