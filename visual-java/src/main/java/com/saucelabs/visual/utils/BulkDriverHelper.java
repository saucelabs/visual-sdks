package com.saucelabs.visual.utils;

import com.saucelabs.visual.exception.InvalidSelectorException;
import com.saucelabs.visual.graphql.type.SelectorIn;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.openqa.selenium.By;
import org.openqa.selenium.Rectangle;
import org.openqa.selenium.UnsupportedCommandException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebDriver;

public class BulkDriverHelper {
  private final RemoteWebDriver driver;

  public BulkDriverHelper(RemoteWebDriver driver) {
    this.driver = driver;
  }

  public List<Rectangle> getRects(List<WebElement> elements) {
    try {
      return this.getRectsJS(elements);
    } catch (UnsupportedCommandException e) {
      return this.getRectsNative(elements);
    }
  }

  public List<Boolean> areDisplayed(List<WebElement> elements) {
    try {
      return this.areDisplayedJS(elements);
    } catch (UnsupportedCommandException e) {
      return this.areDisplayedNative(elements);
    }
  }

  public List<List<WebElement>> resolveElements(List<SelectorIn> selectors) {
    try {
      return this.resolveElementsJS(selectors);
    } catch (UnsupportedCommandException e) {
      return this.resolveElementsNative(selectors);
    }
  }

  public List<Rectangle> getRectsJS(List<WebElement> elements) {
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

  private List<Boolean> areDisplayedJS(List<WebElement> elements) {
    final String script =
        "return Array.from(arguments[0]).map(function (element) {"
            + "  if (!element) throw new Error('element cannot be null');"
            + "  return element.checkVisibility();"
            + "});";

    return (List<Boolean>) driver.executeScript(script, elements);
  }

  private List<List<WebElement>> resolveElementsJS(List<SelectorIn> selectors) {
    final String script =
        "return Array.from(arguments[0]).map(function (xpath) {"
            + "  var it = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);"
            + "  var result = [];"
            + "  var element;"
            + "  while (element = it.iterateNext()) {"
            + "    result.push(element);"
            + "  };"
            + "  return result;"
            + "})";

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

    return (List<List<WebElement>>) driver.executeScript(script, xpaths);
  }

  private List<Rectangle> getRectsNative(List<WebElement> elements) {
    return elements.stream().map(WebElement::getRect).collect(Collectors.toList());
  }

  private List<Boolean> areDisplayedNative(List<WebElement> elements) {
    return elements.stream().map(WebElement::isDisplayed).collect(Collectors.toList());
  }

  private List<List<WebElement>> resolveElementsNative(List<SelectorIn> selectors) {
    return selectors.stream()
        .map(
            selector -> {
              By bySelector;

              switch (selector.getType()) {
                case XPATH:
                  bySelector = By.xpath(selector.getValue());
                  break;
                default:
                  throw new InvalidSelectorException(selector, "Unsupported selector type");
              }

              return driver.findElements(bySelector);
            })
        .collect(Collectors.toList());
  }
}
