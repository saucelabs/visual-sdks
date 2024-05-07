package com.saucelabs.visual.model;

import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.graphql.type.RegionIn;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Rectangle;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class VisualRegion {
  private DiffingOptionsIn options;
  private boolean isIgnoreRegion;
  private WebElement element;
  private int x;
  private int y;
  private int width;
  private int height;
  private String name;

  private VisualRegion() {}

  public VisualRegion(IgnoreRegion ir) {
    this.options = setAllFlags(new DiffingOptionsIn(), false);
    this.isIgnoreRegion = true;
    this.name = ir.getName();
    this.height = ir.getHeight();
    this.width = ir.getWidth();
    this.x = ir.getX();
    this.y = ir.getY();
  }

  public static VisualRegion ignoreChangesFor(WebElement element) {
    VisualRegion r = new VisualRegion();
    r.options = setAllFlags(new DiffingOptionsIn(), false);
    r.isIgnoreRegion = true;
    r.element = element;
    return r;
  }

  public static VisualRegion detectChangesFor(WebElement element) {
    VisualRegion r = new VisualRegion();
    r.options = setAllFlags(new DiffingOptionsIn(), true);
    r.isIgnoreRegion = false;
    r.element = element;
    return r;
  }

  public static VisualRegion ignoreChangesFor(String name, int x, int y, int width, int height) {
    VisualRegion r = new VisualRegion();
    r.options = setAllFlags(new DiffingOptionsIn(), false);
    r.isIgnoreRegion = true;
    r.name = name;
    r.height = height;
    r.width = width;
    r.x = x;
    r.y = y;
    return r;
  }

  public static VisualRegion ignoreChangesFor(int x, int y, int width, int height) {
    return VisualRegion.ignoreChangesFor("", x, y, width, height);
  }

  public static VisualRegion detectChangesFor(String name, int x, int y, int width, int height) {
    VisualRegion r = new VisualRegion();
    r.options = setAllFlags(new DiffingOptionsIn(), true);
    r.isIgnoreRegion = false;
    r.name = name;
    r.height = height;
    r.width = width;
    r.x = x;
    r.y = y;
    return r;
  }

  public static VisualRegion detectChangesFor(int x, int y, int width, int height) {
    return VisualRegion.detectChangesFor("", x, y, width, height);
  }

  private static DiffingOptionsIn setAllFlags(DiffingOptionsIn opt, boolean value) {
    opt.setContent(value);
    opt.setDimensions(value);
    opt.setPosition(value);
    opt.setStructure(value);
    opt.setStyle(value);
    opt.setVisual(value);
    return opt;
  }

  public WebElement getElement() {
    return element;
  }

  public void setElement(WebElement value) {
    this.element = value;
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

  public VisualRegion except(DiffingFlag flags) {
    flags.apply(this.options, this.isIgnoreRegion);
    return this;
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

  public RegionIn toRegionIn() {
    RegionIn r = new RegionIn();
    r.setName(this.name);
    r.setHeight(this.height);
    r.setWidth(this.width);
    r.setX(this.x);
    r.setY(this.y);
    r.setDiffingOptions(this.options);

    if (this.element != null) {
      Rectangle rect = element.getRect();
      r.setX(rect.getX());
      r.setY(rect.getY());
      r.setWidth(rect.getWidth());
      r.setHeight(rect.getHeight());
    }

    return r;
  }
}
