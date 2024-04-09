package com.saucelabs.visual;

import com.saucelabs.visual.model.FullPageScreenshotConfig;
import com.saucelabs.visual.model.IgnoreRegion;
import java.util.ArrayList;
import java.util.List;
import org.openqa.selenium.WebElement;

public class CheckOptions {

  public enum DiffingMethod {
    SIMPLE,
    EXPERIMENTAL
  }

  public CheckOptions() {}

  public CheckOptions(
      List<WebElement> ignoreElements,
      List<IgnoreRegion> ignoreRegions,
      String testName,
      String suiteName,
      DiffingMethod diffingMethod,
      Boolean captureDom,
      String clipSelector,
      FullPageScreenshotConfig fullPageScreenshotConfig) {
    this.ignoreElements = ignoreElements;
    this.ignoreRegions = ignoreRegions;
    this.testName = testName;
    this.suiteName = suiteName;
    this.diffingMethod = diffingMethod;
    this.captureDom = captureDom;
    this.clipSelector = clipSelector;
    this.fullPageScreenshotConfig = fullPageScreenshotConfig;
  }

  private List<WebElement> ignoreElements = new ArrayList<>();
  private List<IgnoreRegion> ignoreRegions = new ArrayList<>();

  private String testName;
  private String suiteName;
  private DiffingMethod diffingMethod;
  private Boolean captureDom;
  private String clipSelector;

  private FullPageScreenshotConfig fullPageScreenshotConfig;

  public static class Builder {
    private List<WebElement> ignoreElements = new ArrayList<>();
    private List<IgnoreRegion> ignoreRegions = new ArrayList<>();
    private String testName;
    private String suiteName;
    private DiffingMethod diffingMethod;
    private Boolean captureDom;
    private String clipSelector;
    private FullPageScreenshotConfig fullPageScreenshotConfig;

    public Builder withIgnoreElements(List<WebElement> ignoreElements) {
      this.ignoreElements = ignoreElements;
      return this;
    }

    public Builder withIgnoreRegions(List<IgnoreRegion> ignoreRegions) {
      this.ignoreRegions = ignoreRegions;
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

    public CheckOptions build() {
      return new CheckOptions(
          ignoreElements,
          ignoreRegions,
          testName,
          suiteName,
          diffingMethod,
          captureDom,
          clipSelector,
          fullPageScreenshotConfig);
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

  public String getTestName() {
    return testName;
  }

  public void setTestName(String testName) {
    this.testName = testName;
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
