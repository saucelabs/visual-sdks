package com.saucelabs.visual.spi;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.openqa.selenium.remote.RemoteWebDriver;

/**
 * Everything a {@link NativeFullPageCapturer} needs for one capture. Build with {@link #builder}.
 */
public final class NativeFullPageRequest {
  private final RemoteWebDriver driver;
  private final NativePlatform platform;
  private final String scrollElementId;
  private final int scrollLimit;
  private final int delayAfterScrollMs;
  private final NativeScrollOption scrollOption;
  private final NativeSelector clipSelector;
  private final List<NativeSelector> ignoreSelectors;
  private final Map<String, Object> systemBarInfo;

  private NativeFullPageRequest(Builder builder) {
    this.driver = Objects.requireNonNull(builder.driver, "driver");
    this.platform = Objects.requireNonNull(builder.platform, "platform");
    this.scrollElementId = builder.scrollElementId;
    this.scrollLimit = builder.scrollLimit;
    this.delayAfterScrollMs = builder.delayAfterScrollMs;
    this.scrollOption =
        builder.scrollOption != null ? builder.scrollOption : NativeScrollOption.START_FROM_TOP;
    this.clipSelector = builder.clipSelector;
    this.ignoreSelectors = Collections.unmodifiableList(new ArrayList<>(builder.ignoreSelectors));
    this.systemBarInfo =
        builder.systemBarInfo != null
            ? Collections.unmodifiableMap(new LinkedHashMap<>(builder.systemBarInfo))
            : null;
  }

  public static Builder builder() {
    return new Builder();
  }

  /** The Appium session to capture. */
  public RemoteWebDriver getDriver() {
    return driver;
  }

  public NativePlatform getPlatform() {
    return platform;
  }

  /** WebDriver id of the scrollable container, or null to use the app's root element. */
  public String getScrollElementId() {
    return scrollElementId;
  }

  /** Requested maximum number of scrolls as configured by the user; 0 when unset. */
  public int getScrollLimit() {
    return scrollLimit;
  }

  /** Delay before each capture, in milliseconds; 0 when unset. */
  public int getDelayAfterScrollMs() {
    return delayAfterScrollMs;
  }

  /** Never null; defaults to {@link NativeScrollOption#START_FROM_TOP}. */
  public NativeScrollOption getScrollOption() {
    return scrollOption;
  }

  /** Element to clip the stitched image to, or null. */
  public NativeSelector getClipSelector() {
    return clipSelector;
  }

  /** Selectors whose matches should be reported as ignore regions. Never null. */
  public List<NativeSelector> getIgnoreSelectors() {
    return ignoreSelectors;
  }

  /**
   * Raw response of Appium's "mobile: getSystemBars" (Android) or "mobile: deviceScreenInfo" (iOS),
   * or null when unavailable.
   */
  public Map<String, Object> getSystemBarInfo() {
    return systemBarInfo;
  }

  public static final class Builder {
    private RemoteWebDriver driver;
    private NativePlatform platform;
    private String scrollElementId;
    private int scrollLimit;
    private int delayAfterScrollMs;
    private NativeScrollOption scrollOption;
    private NativeSelector clipSelector;
    private List<NativeSelector> ignoreSelectors = Collections.emptyList();
    private Map<String, Object> systemBarInfo;

    private Builder() {}

    public Builder withDriver(RemoteWebDriver driver) {
      this.driver = driver;
      return this;
    }

    public Builder withPlatform(NativePlatform platform) {
      this.platform = platform;
      return this;
    }

    public Builder withScrollElementId(String scrollElementId) {
      this.scrollElementId = scrollElementId;
      return this;
    }

    public Builder withScrollLimit(int scrollLimit) {
      this.scrollLimit = scrollLimit;
      return this;
    }

    public Builder withDelayAfterScrollMs(int delayAfterScrollMs) {
      this.delayAfterScrollMs = delayAfterScrollMs;
      return this;
    }

    public Builder withScrollOption(NativeScrollOption scrollOption) {
      this.scrollOption = scrollOption;
      return this;
    }

    public Builder withClipSelector(NativeSelector clipSelector) {
      this.clipSelector = clipSelector;
      return this;
    }

    public Builder withIgnoreSelectors(List<NativeSelector> ignoreSelectors) {
      this.ignoreSelectors = ignoreSelectors != null ? ignoreSelectors : Collections.emptyList();
      return this;
    }

    public Builder withSystemBarInfo(Map<String, Object> systemBarInfo) {
      this.systemBarInfo = systemBarInfo;
      return this;
    }

    public NativeFullPageRequest build() {
      return new NativeFullPageRequest(this);
    }
  }
}
