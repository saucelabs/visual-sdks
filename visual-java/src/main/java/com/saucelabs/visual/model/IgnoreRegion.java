package com.saucelabs.visual.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class IgnoreRegion {
  private String name;
  private int height;
  private int width;
  private int x;
  private int y;

  public IgnoreRegion(String name, int x, int y, int width, int height) {
    this.name = name;
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;
  }

  public IgnoreRegion(int x, int y, int width, int height) {
    this.name = "";
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public int getHeight() {
    return height;
  }

  public void setHeight(int height) {
    this.height = height;
  }

  public int getWidth() {
    return width;
  }

  public void setWidth(int width) {
    this.width = width;
  }

  public int getX() {
    return x;
  }

  public void setX(int x) {
    this.x = x;
  }

  public int getY() {
    return y;
  }

  public void setY(int y) {
    this.y = y;
  }

  public static List<IgnoreRegion> forElement(WebDriver driver, List<WebElement> elements) {
    JavascriptExecutor js = (JavascriptExecutor) driver;

    List<Map<String, Long>> rects =
        (List<Map<String, Long>>)
            js.executeScript(
                "return Array.from(arguments[0]).map(function(element) {"
                    + "  const rect = element.getBoundingClientRect();"
                    + "  return {"
                    + "    top: Math.round(rect.top),"
                    + "    left: Math.round(rect.left),"
                    + "    width: Math.round(rect.width),"
                    + "    height: Math.round(rect.height)"
                    + "  };"
                    + "});",
                elements);

    List<IgnoreRegion> ignoreRegions = new ArrayList<>(rects.size());
    for (Map<String, Long> rect : rects) {
      // Convert the rect to an IgnoreRegion
      int x = rect.get("left").intValue();
      int y = rect.get("top").intValue();
      int width = rect.get("width").intValue();
      int height = rect.get("height").intValue();

      ignoreRegions.add(new IgnoreRegion(x, y, width, height));
    }

    return ignoreRegions;
  }
}
