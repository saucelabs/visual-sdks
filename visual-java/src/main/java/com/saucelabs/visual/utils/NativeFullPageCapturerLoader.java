package com.saucelabs.visual.utils;

import com.saucelabs.visual.spi.NativeFullPageCapturer;
import java.util.Iterator;
import java.util.NoSuchElementException;
import java.util.ServiceConfigurationError;
import java.util.ServiceLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Finds the {@link NativeFullPageCapturer} registered on the classpath, if any. */
public final class NativeFullPageCapturerLoader {
  private static final Logger log = LoggerFactory.getLogger(NativeFullPageCapturerLoader.class);

  private static final int MAX_ATTEMPTS = 32;

  private NativeFullPageCapturerLoader() {}

  /** Loads with the SDK's own class loader. */
  public static NativeFullPageCapturer load() {
    return load(NativeFullPageCapturer.class.getClassLoader());
  }

  /**
   * Returns the first compatible implementation registered under {@code
   * META-INF/services/com.saucelabs.visual.spi.NativeFullPageCapturer}, or null when there's none.
   * Broken or incompatible implementations are skipped with a warning rather than failing checks.
   */
  public static NativeFullPageCapturer load(ClassLoader classLoader) {
    Iterator<NativeFullPageCapturer> iterator =
        ServiceLoader.load(NativeFullPageCapturer.class, classLoader).iterator();
    NativeFullPageCapturer found = null;
    // Bounded so a malformed services file that keeps failing can't loop forever.
    for (int attempt = 0; found == null && attempt < MAX_ATTEMPTS && hasNext(iterator); attempt++) {
      NativeFullPageCapturer candidate = next(iterator);
      if (candidate != null && isCompatible(candidate)) {
        found = candidate;
      }
    }
    return found;
  }

  private static boolean hasNext(Iterator<NativeFullPageCapturer> iterator) {
    try {
      return iterator.hasNext();
    } catch (ServiceConfigurationError e) {
      warnLoadFailure(e);
      // Let next() move past the broken entry.
      return true;
    }
  }

  private static NativeFullPageCapturer next(Iterator<NativeFullPageCapturer> iterator) {
    try {
      return iterator.next();
    } catch (ServiceConfigurationError | NoSuchElementException e) {
      warnLoadFailure(e);
      return null;
    }
  }

  private static boolean isCompatible(NativeFullPageCapturer capturer) {
    int apiVersion;
    try {
      apiVersion = capturer.apiVersion();
    } catch (RuntimeException | LinkageError e) {
      log.warn(
          "Sauce Labs Visual: ignoring native full-page screenshot plugin {}: {}",
          capturer.getClass().getName(),
          e.toString());
      return false;
    }
    if (apiVersion > NativeFullPageCapturer.API_VERSION) {
      log.warn(
          "Sauce Labs Visual: ignoring native full-page screenshot plugin {}: it needs SPI "
              + "version {} but this SDK provides {}. Upgrade the Sauce Visual SDK.",
          capturer.getClass().getName(),
          apiVersion,
          NativeFullPageCapturer.API_VERSION);
      return false;
    }
    return true;
  }

  private static void warnLoadFailure(Throwable e) {
    log.warn(
        "Sauce Labs Visual: failed to load a native full-page screenshot plugin: {}",
        e.getMessage());
  }
}
