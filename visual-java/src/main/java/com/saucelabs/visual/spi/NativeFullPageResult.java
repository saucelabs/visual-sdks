package com.saucelabs.visual.spi;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/** The output of a {@link NativeFullPageCapturer}. Build with {@link #builder}. */
public final class NativeFullPageResult {
  private final byte[] screenshot;
  private final List<NativeIgnoreRegion> ignoreRegions;
  private final NativeRect clipRegion;
  private final double viewportOffsetY;

  private NativeFullPageResult(Builder builder) {
    this.screenshot = Objects.requireNonNull(builder.screenshot, "screenshot");
    this.ignoreRegions = Collections.unmodifiableList(new ArrayList<>(builder.ignoreRegions));
    this.clipRegion = builder.clipRegion;
    this.viewportOffsetY = builder.viewportOffsetY;
  }

  public static Builder builder() {
    return new Builder();
  }

  /** The stitched PNG, already clipped when the request had a clip selector. */
  public byte[] getScreenshot() {
    return screenshot;
  }

  /**
   * Regions matched by the request's ignore selectors, in logical coordinates relative to the top
   * of the stitched image (before clipping). Never null.
   */
  public List<NativeIgnoreRegion> getIgnoreRegions() {
    return ignoreRegions;
  }

  /**
   * The area the image was clipped to, in logical coordinates relative to the top of the stitched
   * image; null when not clipped.
   */
  public NativeRect getClipRegion() {
    return clipRegion;
  }

  /**
   * Logical Y position, on screen, of the stitched image's top edge (e.g. the status bar height).
   * The SDK subtracts it from viewport coordinates to make them relative to the stitched image.
   */
  public double getViewportOffsetY() {
    return viewportOffsetY;
  }

  public static final class Builder {
    private byte[] screenshot;
    private List<NativeIgnoreRegion> ignoreRegions = Collections.emptyList();
    private NativeRect clipRegion;
    private double viewportOffsetY;

    private Builder() {}

    public Builder withScreenshot(byte[] screenshot) {
      this.screenshot = screenshot;
      return this;
    }

    public Builder withIgnoreRegions(List<NativeIgnoreRegion> ignoreRegions) {
      this.ignoreRegions = ignoreRegions != null ? ignoreRegions : Collections.emptyList();
      return this;
    }

    public Builder withClipRegion(NativeRect clipRegion) {
      this.clipRegion = clipRegion;
      return this;
    }

    public Builder withViewportOffsetY(double viewportOffsetY) {
      this.viewportOffsetY = viewportOffsetY;
      return this;
    }

    public NativeFullPageResult build() {
      return new NativeFullPageResult(this);
    }
  }
}
