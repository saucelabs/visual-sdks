package com.saucelabs.visual.spi;

/**
 * An area of the stitched image matched by one of the request's ignore selectors. The SDK maps it
 * back to that selector's name and diffing options.
 */
public final class NativeIgnoreRegion {
  private final int selectorIndex;
  private final NativeRect rect;

  /**
   * @param selectorIndex index in {@link NativeFullPageRequest#getIgnoreSelectors()} of the
   *     selector that matched
   * @param rect the region, in logical coordinates relative to the top of the stitched image
   *     (before clipping)
   */
  public NativeIgnoreRegion(int selectorIndex, NativeRect rect) {
    this.selectorIndex = selectorIndex;
    this.rect = rect;
  }

  public int getSelectorIndex() {
    return selectorIndex;
  }

  public NativeRect getRect() {
    return rect;
  }

  @Override
  public String toString() {
    return "NativeIgnoreRegion{selectorIndex=" + selectorIndex + ", rect=" + rect + "}";
  }
}
