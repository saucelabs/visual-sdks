package com.saucelabs.visual.model;

import java.util.Arrays;
import java.util.List;

public class FullPageScreenshotConfig {

  private int addressBarShadowPadding;
  private int delayAfterScrollMs;
  private Boolean disableCSSAnimation;
  private List<String> hideAfterFirstScroll;
  private Boolean hideScrollBars;
  private int toolBarShadowPadding;
  private int scrollLimit;

  public FullPageScreenshotConfig(int addressBarShadowPadding, int delayAfterScrollMs, Boolean disableCSSAnimation, List<String> hideAfterFirstScroll, Boolean hideScrollBars, int toolBarShadowPadding, int scrollLimit) {
    this.addressBarShadowPadding = addressBarShadowPadding;
    this.delayAfterScrollMs = delayAfterScrollMs;
    this.disableCSSAnimation = disableCSSAnimation;
    this.hideAfterFirstScroll = hideAfterFirstScroll;
    this.hideScrollBars = hideScrollBars;
    this.toolBarShadowPadding = toolBarShadowPadding;
    this.scrollLimit = scrollLimit;
  }

  public static class Builder {
    private int addressBarShadowPadding;
    private int delayAfterScrollMs;
    private Boolean disableCSSAnimation;
    private List<String> hideAfterFirstScroll;
    private Boolean hideScrollBars;
    private int toolBarShadowPadding;
    private int scrollLimit;

    public Builder withAddressBarShadowPadding(int addressBarShadowPadding) {
      this.addressBarShadowPadding = addressBarShadowPadding;
      return this;
    }

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

    public Builder withToolBarShadowPadding(int toolBarShadowPadding) {
      this.toolBarShadowPadding = toolBarShadowPadding;
      return this;
    }

    public Builder withScrollLimit(int scrollLimit) {
      if (scrollLimit > 0 && scrollLimit <= 10) {
        this.scrollLimit = scrollLimit;
      } else {
        this.scrollLimit = 10;
      }

      return this;
    }

    public FullPageScreenshotConfig build() {
      return new FullPageScreenshotConfig(addressBarShadowPadding, delayAfterScrollMs, disableCSSAnimation, hideAfterFirstScroll, hideScrollBars, toolBarShadowPadding, scrollLimit);
    }
  }

  public int getAddressBarShadowPadding() {
    return addressBarShadowPadding;
  }
  public void setAddressBarShadowPadding(int addressBarShadowPadding) {
    this.addressBarShadowPadding = addressBarShadowPadding;
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

  public int getToolBarShadowPadding() {
    return toolBarShadowPadding;
  }

  public void setToolBarShadowPadding(int toolBarShadowPadding) {
    this.toolBarShadowPadding = toolBarShadowPadding;
  }

  public int getScrollLimit() {
    return scrollLimit;
  }

  public void setScrollLimit(int scrollLimit) {
    this.scrollLimit = scrollLimit;
  }
}
