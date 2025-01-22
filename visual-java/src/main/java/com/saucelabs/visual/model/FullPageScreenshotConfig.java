package com.saucelabs.visual.model;

import com.saucelabs.visual.graphql.type.ScrollOption;
import com.saucelabs.visual.graphql.type.SelectorIn;
import java.util.Arrays;
import java.util.List;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebElement;

public class FullPageScreenshotConfig {

  private int delayAfterScrollMs;
  private Boolean disableCSSAnimation;
  private List<String> hideAfterFirstScroll;
  private Boolean hideScrollBars;
  private int scrollLimit;
  private String scrollElement;
  private SelectorIn nativeClipSelector;
  private ScrollOption scrollOption;

  public FullPageScreenshotConfig(
      int delayAfterScrollMs,
      Boolean disableCSSAnimation,
      List<String> hideAfterFirstScroll,
      Boolean hideScrollBars,
      int scrollLimit,
      String scrollElement) {
    this(
        delayAfterScrollMs,
        disableCSSAnimation,
        hideAfterFirstScroll,
        hideScrollBars,
        scrollLimit,
        scrollElement,
        null,
        null);
  }

  public FullPageScreenshotConfig(
      int delayAfterScrollMs,
      Boolean disableCSSAnimation,
      List<String> hideAfterFirstScroll,
      Boolean hideScrollBars,
      int scrollLimit,
      String scrollElement,
      SelectorIn nativeClipSelector) {
    this(
        delayAfterScrollMs,
        disableCSSAnimation,
        hideAfterFirstScroll,
        hideScrollBars,
        scrollLimit,
        scrollElement,
        nativeClipSelector,
        null);
  }

  private FullPageScreenshotConfig(
      int delayAfterScrollMs,
      Boolean disableCSSAnimation,
      List<String> hideAfterFirstScroll,
      Boolean hideScrollBars,
      int scrollLimit,
      String scrollElement,
      SelectorIn nativeClipSelector,
      ScrollOption scrollOption) {
    this.delayAfterScrollMs = delayAfterScrollMs;
    this.disableCSSAnimation = disableCSSAnimation;
    this.hideAfterFirstScroll = hideAfterFirstScroll;
    this.hideScrollBars = hideScrollBars;
    this.scrollLimit = scrollLimit;
    this.scrollElement = scrollElement;
    this.nativeClipSelector = nativeClipSelector;
    this.scrollOption = scrollOption;
  }

  public static class Builder {
    private int delayAfterScrollMs;
    private Boolean disableCSSAnimation;
    private List<String> hideAfterFirstScroll;
    private Boolean hideScrollBars;
    private int scrollLimit;
    private String scrollElement;
    private SelectorIn nativeClipSelector;
    private ScrollOption scrollOption;

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

    /**
     * Only used for native app testing
     *
     * @param scrollElement WebElement to scroll to
     * @return Builder instance
     */
    public Builder withScrollElement(WebElement scrollElement) {
      this.scrollElement = ((RemoteWebElement) scrollElement).getId();
      return this;
    }

    /**
     * Only used for native app testing
     *
     * @param nativeClipSelector SelectorIn to clip
     * @return Builder instance
     */
    public Builder withNativeClipSelector(SelectorIn nativeClipSelector) {
      this.nativeClipSelector = nativeClipSelector;
      return this;
    }

    /**
     * Only effective for native app testing
     *
     * @param scrollOption ScrollOption to select which scroll behavior Full-Page screenshot should
     *     have.
     * @return Builder instance
     */
    public Builder withScrollOption(ScrollOption scrollOption) {
      this.scrollOption = scrollOption;
      return this;
    }

    public FullPageScreenshotConfig build() {
      return new FullPageScreenshotConfig(
          delayAfterScrollMs,
          disableCSSAnimation,
          hideAfterFirstScroll,
          hideScrollBars,
          scrollLimit,
          scrollElement,
          nativeClipSelector,
          scrollOption);
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

  public String getScrollElement() {
    return scrollElement;
  }

  /**
   * Only used for native app testing
   *
   * @param scrollElement WebElement to scroll to
   */
  public void setScrollElement(WebElement scrollElement) {
    this.scrollElement = ((RemoteWebElement) scrollElement).getId();
  }

  public SelectorIn getNativeClipSelector() {
    return nativeClipSelector;
  }

  /**
   * Only used for native app testing
   *
   * @param nativeClipSelector SelectorIn to clip
   */
  public void setNativeClipSelector(SelectorIn nativeClipSelector) {
    this.nativeClipSelector = nativeClipSelector;
  }

  public ScrollOption getScrollOption() {
    return scrollOption;
  }

  /**
   * Only effective for native app testing
   *
   * @param scrollOption ScrollOption to use
   */
  public void setScrollOption(ScrollOption scrollOption) {
    this.scrollOption = scrollOption;
  }
}
