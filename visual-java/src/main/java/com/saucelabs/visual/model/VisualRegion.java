package com.saucelabs.visual.model;

import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.graphql.type.ElementIn;
import com.saucelabs.visual.graphql.type.RegionIn;
import java.util.EnumSet;
import org.openqa.selenium.Rectangle;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebElement;

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

  public VisualRegion(IgnoreRegion ir, DiffingOptionsIn diffingOptions) {
    this.options = diffingOptions;
    this.isIgnoreRegion = true;
    this.name = ir.getName();
    this.height = ir.getHeight();
    this.width = ir.getWidth();
    this.x = ir.getX();
    this.y = ir.getY();
  }

  public VisualRegion(WebElement element, DiffingOptionsIn diffingOptions) {
    this.options = diffingOptions;
    this.element = element;
  }

  public VisualRegion(String name, Rectangle rectangle, DiffingOptionsIn diffingOptions) {
    this.name = name;
    this.options = diffingOptions;
    this.height = rectangle.height;
    this.width = rectangle.width;
    this.x = rectangle.x;
    this.y = rectangle.y;
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

  public static VisualRegion ignoreChangesFor(Rectangle rectangle) {
    return VisualRegion.ignoreChangesFor(
        "", rectangle.x, rectangle.y, rectangle.width, rectangle.height);
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

  public DiffingOptionsIn getOptions() {
    return options;
  }

  public VisualRegion except(EnumSet<DiffingFlag> flags) {
    for (DiffingFlag f : flags) {
      f.apply(this.options, this.isIgnoreRegion);
    }
    return this;
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

  public ElementIn toElementIn() {
    ElementIn e = new ElementIn();

    e.setName(this.name);
    e.setDiffingOptions(this.options);
    e.setId(((RemoteWebElement) this.element).getId());

    return e;
  }
}
