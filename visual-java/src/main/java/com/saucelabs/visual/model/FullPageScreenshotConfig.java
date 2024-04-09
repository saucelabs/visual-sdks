package com.saucelabs.visual.model;

import java.util.Arrays;
import java.util.List;

public class FullPageScreenshotConfig {

  private int delayAfterScrollMs;
  private List<String> hideAfterFirstScroll;

  public FullPageScreenshotConfig(int delayAfterScrollMs, List<String> hideAfterFirstScroll) {
    this.delayAfterScrollMs = delayAfterScrollMs;
    this.hideAfterFirstScroll = hideAfterFirstScroll;
  }

  public static class Builder {
    private int delayAfterScrollMs;
    private List<String> hideAfterFirstScroll;

    public Builder withDelayAfterScrollMs(int delayAfterScrollMs) {
      this.delayAfterScrollMs = delayAfterScrollMs;
      return this;
    }

    public Builder withHideAfterFirstScroll(String... hideAfterFirstScroll) {
      this.hideAfterFirstScroll = Arrays.asList(hideAfterFirstScroll);
      return this;
    }

    public FullPageScreenshotConfig build() {
      return new FullPageScreenshotConfig(delayAfterScrollMs, hideAfterFirstScroll);
    }
  }

  public int getDelayAfterScrollMs() {
    return delayAfterScrollMs;
  }

  public void setDelayAfterScrollMs(int delayAfterScrollMs) {
    this.delayAfterScrollMs = delayAfterScrollMs;
  }

  public List<String> getHideAfterFirstScroll() {
    return hideAfterFirstScroll;
  }

  public void setHideAfterFirstScroll(String... hideAfterFirstScroll) {
    this.hideAfterFirstScroll = Arrays.asList(hideAfterFirstScroll);
  }
}
