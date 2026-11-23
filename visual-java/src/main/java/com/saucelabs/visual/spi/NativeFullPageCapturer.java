package com.saucelabs.visual.spi;

/**
 * Service provider interface for native mobile app full-page screenshots on local (non Sauce Labs)
 * sessions.
 *
 * <p>The SDK doesn't ship an implementation. One is picked up through {@link
 * java.util.ServiceLoader} when a jar on the classpath registers it in {@code
 * META-INF/services/com.saucelabs.visual.spi.NativeFullPageCapturer}. Without one, native full-page
 * checks fall back to a single viewport screenshot.
 *
 * <p>Compatibility: implementations are compiled against one SDK version and run against others.
 * Only ever add {@code default} methods to this interface, and only add (never remove or change)
 * members of the request / result types.
 */
public interface NativeFullPageCapturer {

  /** The SPI version this SDK was built with. */
  int API_VERSION = 1;

  /**
   * Scrolls the app, captures and stitches a full-page screenshot.
   *
   * @param request what to capture and the session to capture it from
   * @return the stitched screenshot and the regions found while scrolling
   * @throws NativeFullPageException when the capture fails
   */
  NativeFullPageResult capture(NativeFullPageRequest request);

  /**
   * The SPI version this implementation was built against. The SDK ignores implementations built
   * against a newer, unknown version.
   *
   * @return the SPI version
   */
  default int apiVersion() {
    return 1;
  }
}
