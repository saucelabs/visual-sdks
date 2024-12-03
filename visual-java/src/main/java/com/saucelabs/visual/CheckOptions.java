package com.saucelabs.visual;

import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.graphql.type.IgnoreSelectorIn;
import com.saucelabs.visual.model.DiffingFlag;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import com.saucelabs.visual.model.IgnoreRegion;
import com.saucelabs.visual.model.VisualRegion;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import org.openqa.selenium.WebElement;

public class CheckOptions {

  public enum DiffingMethod {
    SIMPLE,
    EXPERIMENTAL,
    BALANCED,
  }

  public CheckOptions() {}

  public CheckOptions(
      List<WebElement> ignoreElements,
      List<IgnoreRegion> ignoreRegions,
      List<VisualRegion> regions,
      String testName,
      String suiteName,
      DiffingMethod diffingMethod,
      DiffingOptionsIn diffingOptions,
      Boolean captureDom,
      String clipSelector,
      WebElement clipElement,
      FullPageScreenshotConfig fullPageScreenshotConfig) {
    this(
        ignoreElements,
        ignoreRegions,
        regions,
        testName,
        suiteName,
        diffingMethod,
        diffingOptions,
        captureDom,
        clipSelector,
        clipElement,
        fullPageScreenshotConfig,
        null);
  }

  public CheckOptions(
      List<WebElement> ignoreElements,
      List<IgnoreRegion> ignoreRegions,
      List<VisualRegion> regions,
      String testName,
      String suiteName,
      DiffingMethod diffingMethod,
      DiffingOptionsIn diffingOptions,
      Boolean captureDom,
      String clipSelector,
      WebElement clipElement,
      FullPageScreenshotConfig fullPageScreenshotConfig,
      List<IgnoreSelectorIn> ignoreSelectors) {
    this.ignoreElements = ignoreElements;
    this.ignoreRegions = ignoreRegions;
    this.ignoreSelectors = ignoreSelectors;
    this.regions = regions;
    this.testName = testName;
    this.suiteName = suiteName;
    this.diffingMethod = diffingMethod;
    this.captureDom = captureDom;
    this.clipSelector = clipSelector;
    this.clipElement = clipElement;
    this.fullPageScreenshotConfig = fullPageScreenshotConfig;
    this.diffingOptions = diffingOptions;
  }

  private List<WebElement> ignoreElements = new ArrayList<>();
  private List<IgnoreRegion> ignoreRegions = new ArrayList<>();
  private List<IgnoreSelectorIn> ignoreSelectors = new ArrayList<>();
  private List<VisualRegion> regions = new ArrayList<>();

  private String testName;
  private String suiteName;
  private DiffingMethod diffingMethod;
  private DiffingOptionsIn diffingOptions;
  private Boolean captureDom;
  private String clipSelector;
  private WebElement clipElement;
  private FullPageScreenshotConfig fullPageScreenshotConfig;

  public static class Builder {
    private List<WebElement> ignoreElements = new ArrayList<>();
    private List<IgnoreRegion> ignoreRegions = new ArrayList<>();
    private List<IgnoreSelectorIn> ignoreSelectors = new ArrayList<>();
    private List<VisualRegion> regions = new ArrayList<>();
    private String testName;
    private String suiteName;
    private DiffingMethod diffingMethod;
    private DiffingOptionsIn diffingOptions;
    private Boolean captureDom;
    private String clipSelector;
    private WebElement clipElement;
    private FullPageScreenshotConfig fullPageScreenshotConfig;

    public Builder withIgnoreElements(List<WebElement> ignoreElements) {
      this.ignoreElements = ignoreElements;
      return this;
    }

    public Builder withIgnoreRegions(List<IgnoreRegion> ignoreRegions) {
      this.ignoreRegions = ignoreRegions;
      return this;
    }

    public Builder withIgnoreSelectors(List<IgnoreSelectorIn> ignoreSelectors) {
      this.ignoreSelectors = ignoreSelectors;
      return this;
    }

    public Builder withTestName(String testName) {
      this.testName = testName;
      return this;
    }

    public Builder withSuiteName(String suiteName) {
      this.suiteName = suiteName;
      return this;
    }

    public Builder withDiffingMethod(DiffingMethod diffingMethod) {
      this.diffingMethod = diffingMethod;
      return this;
    }

    public Builder withCaptureDom(Boolean captureDom) {
      this.captureDom = captureDom;
      return this;
    }

    public Builder withClipSelector(String clipSelector) {
      this.clipSelector = clipSelector;
      return this;
    }

    public Builder withFullPageConfig(FullPageScreenshotConfig fullPageScreenshotConfig) {
      this.fullPageScreenshotConfig = fullPageScreenshotConfig;
      return this;
    }

    public Builder withClipElement(WebElement clipElement) {
      this.clipElement = clipElement;
      return this;
    }

    public Builder disableOnly(EnumSet<DiffingFlag> flags) {
      this.diffingOptions = new DiffingOptionsIn();
      DiffingFlag.setAll(this.diffingOptions, true);
      for (DiffingFlag f : flags) f.apply(this.diffingOptions, false);
      return this;
    }

    public Builder enableOnly(EnumSet<DiffingFlag> flags) {
      this.diffingOptions = new DiffingOptionsIn();
      DiffingFlag.setAll(this.diffingOptions, false);
      for (DiffingFlag f : flags) f.apply(this.diffingOptions, true);
      return this;
    }

    public Builder enableOnly(EnumSet<DiffingFlag> flags, WebElement element) {

      this.regions.add(VisualRegion.ignoreChangesFor(element).except(flags));
      return this;
    }

    public Builder disableOnly(EnumSet<DiffingFlag> flags, WebElement element) {

      this.regions.add(VisualRegion.detectChangesFor(element).except(flags));
      return this;
    }

    public CheckOptions build() {
      return new CheckOptions(
          ignoreElements,
          ignoreRegions,
          regions,
          testName,
          suiteName,
          diffingMethod,
          diffingOptions,
          captureDom,
          clipSelector,
          clipElement,
          fullPageScreenshotConfig,
          ignoreSelectors);
    }
  }

  public List<WebElement> getIgnoreElements() {
    return ignoreElements;
  }

  public void setIgnoreElements(List<WebElement> ignoreElements) {
    this.ignoreElements = ignoreElements;
  }

  public List<IgnoreRegion> getIgnoreRegions() {
    return ignoreRegions;
  }

  public void setIgnoreRegions(List<IgnoreRegion> ignoreRegions) {
    this.ignoreRegions = ignoreRegions;
  }

  public List<IgnoreSelectorIn> getIgnoreSelectors() {
    return ignoreSelectors;
  }

  public void setIgnoreSelectors(List<IgnoreSelectorIn> ignoreSelectors) {
    this.ignoreSelectors = ignoreSelectors;
  }

  public String getTestName() {
    return testName;
  }

  public void setTestName(String testName) {
    this.testName = testName;
  }

  public List<VisualRegion> getRegions() {
    return regions;
  }

  public void setRegions(List<VisualRegion> regions) {
    this.regions = regions;
  }

  public String getSuiteName() {
    return suiteName;
  }

  public void setSuiteName(String suiteName) {
    this.suiteName = suiteName;
  }

  public void setDiffingMethod(DiffingMethod diffingMethod) {
    this.diffingMethod = diffingMethod;
  }

  public DiffingMethod getDiffingMethod() {
    return diffingMethod;
  }

  public DiffingOptionsIn getDiffingOptions() {
    return diffingOptions;
  }

  public void setCaptureDom(Boolean captureDom) {
    this.captureDom = captureDom;
  }

  public Boolean getCaptureDom() {
    return captureDom;
  }

  public String getClipSelector() {
    return clipSelector;
  }

  public void setClipSelector(String clipSelector) {
    this.clipSelector = clipSelector;
  }

  public WebElement getClipElement() {
    return clipElement;
  }

  public void setClipElement(WebElement clipElement) {
    this.clipElement = clipElement;
  }

  public FullPageScreenshotConfig getFullPageScreenshotConfig() {
    return fullPageScreenshotConfig;
  }

  public void enableFullPageScreenshots(FullPageScreenshotConfig fullPageScreenshotConfig) {
    this.fullPageScreenshotConfig = fullPageScreenshotConfig;
  }

  public void enableFullPageScreenshots() {
    this.fullPageScreenshotConfig = new FullPageScreenshotConfig.Builder().build();
  }
}
