package com.saucelabs.visual.model;

import java.util.Arrays;
import java.util.List;
import org.openqa.selenium.WebElement;

public class FullPageScreenshotConfig {

  private int delayAfterScrollMs;
  private Boolean disableCSSAnimation;
  private List<String> hideAfterFirstScroll;
  private Boolean hideScrollBars;
  private int scrollLimit;
  private WebElement scrollElement;

  public FullPageScreenshotConfig(
      int delayAfterScrollMs,
      Boolean disableCSSAnimation,
      List<String> hideAfterFirstScroll,
      Boolean hideScrollBars,
      int scrollLimit,
      WebElement scrollElement) {
    this.delayAfterScrollMs = delayAfterScrollMs;
    this.disableCSSAnimation = disableCSSAnimation;
    this.hideAfterFirstScroll = hideAfterFirstScroll;
    this.hideScrollBars = hideScrollBars;
    this.scrollLimit = scrollLimit;
    this.scrollElement = scrollElement;
  }

  public static class Builder {
    private int delayAfterScrollMs;
    private Boolean disableCSSAnimation;
    private List<String> hideAfterFirstScroll;
    private Boolean hideScrollBars;
    private int scrollLimit;
    private WebElement scrollElement;

    public Builder withDelayAfterScrollMs(int delayAfterScrollMs) {
      this.delayAfterScrollMs = delayAfterScrollMs;
      return this;
    }

    public Builder withDisableCSSAnimation(Boolean disableCSSAnimation) {
      this.disableCSSAnimation = disableCSSAnimation;
      return this;
    }

    public Builder withHideAfterFirstScroll(String... hideAfterFirstScroll) {
      this.hideAfterFirstScroll = Arrays.asList(hideAfterFirstScroll);
      return this;
    }

    public Builder withHideScrollBars(Boolean hideScrollBars) {
      this.hideScrollBars = hideScrollBars;
      return this;
    }

    public Builder withScrollLimit(int scrollLimit) {
      this.scrollLimit = scrollLimit;
      return this;
    }

    public Builder withScrollElement(WebElement scrollElement) {
      this.scrollElement = scrollElement;
      return this;
    }

    public FullPageScreenshotConfig build() {
      return new FullPageScreenshotConfig(
          delayAfterScrollMs,
          disableCSSAnimation,
          hideAfterFirstScroll,
          hideScrollBars,
          scrollLimit,
          scrollElement);
    }
  }

  public int getDelayAfterScrollMs() {
    return delayAfterScrollMs;
  }

  public void setDelayAfterScrollMs(int delayAfterScrollMs) {
    this.delayAfterScrollMs = delayAfterScrollMs;
  }

  public Boolean getDisableCSSAnimation() {
    return disableCSSAnimation;
  }

  public void setDisableCSSAnimation(Boolean disableCSSAnimation) {
    this.disableCSSAnimation = disableCSSAnimation;
  }

  public List<String> getHideAfterFirstScroll() {
    return hideAfterFirstScroll;
  }

  public void setHideAfterFirstScroll(String... hideAfterFirstScroll) {
    this.hideAfterFirstScroll = Arrays.asList(hideAfterFirstScroll);
  }

  public Boolean getHideScrollBars() {
    return hideScrollBars;
  }

  public void setHideScrollBars(Boolean hideScrollBars) {
    this.hideScrollBars = hideScrollBars;
  }

  public int getScrollLimit() {
    return scrollLimit;
  }

  public void setScrollLimit(int scrollLimit) {
    this.scrollLimit = scrollLimit;
  }

  public WebElement getScrollElement() {
    return scrollElement;
  }

  public void setScrollElement(WebElement scrollElement) {
    this.scrollElement = scrollElement;
  }
}
