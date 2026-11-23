package com.saucelabs.visual.spi;

/** Where a native full-page capture starts scrolling from. */
public enum NativeScrollOption {
  /** Scroll to the top of the container first, and back to it afterwards. */
  START_FROM_TOP,
  /** Start from the current scroll position and leave the container where capture ends. */
  START_FROM_CURRENT_LOCATION
}
