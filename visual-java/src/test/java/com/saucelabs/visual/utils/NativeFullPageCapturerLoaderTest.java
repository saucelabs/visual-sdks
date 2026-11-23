package com.saucelabs.visual.utils;

import static org.junit.jupiter.api.Assertions.*;

import com.saucelabs.visual.spi.NativeFullPageCapturer;
import com.saucelabs.visual.spi.NativeFullPageRequest;
import com.saucelabs.visual.spi.NativeFullPageResult;
import java.io.IOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * The fake plugins below are registered only on a class loader private to each test, never in
 * src/test/resources, so no other test (unit or integration) picks them up.
 */
class NativeFullPageCapturerLoaderTest {

  public static class FakeCapturer implements NativeFullPageCapturer {
    @Override
    public NativeFullPageResult capture(NativeFullPageRequest request) {
      return NativeFullPageResult.builder().withScreenshot(new byte[0]).build();
    }
  }

  /** Built against a newer SPI than this SDK knows: must be skipped. */
  public static class FutureCapturer extends FakeCapturer {
    @Override
    public int apiVersion() {
      return NativeFullPageCapturer.API_VERSION + 1;
    }
  }

  @TempDir Path tempDir;

  @Test
  void loadsFirstCompatibleImplementationTest() throws IOException {
    ClassLoader loader =
        classLoaderRegistering(FutureCapturer.class.getName(), FakeCapturer.class.getName());

    NativeFullPageCapturer capturer = NativeFullPageCapturerLoader.load(loader);

    assertNotNull(capturer);
    assertEquals(FakeCapturer.class, capturer.getClass());
  }

  @Test
  void skipsEntriesThatFailToLoadTest() throws IOException {
    ClassLoader loader =
        classLoaderRegistering("com.example.DoesNotExist", FakeCapturer.class.getName());

    assertEquals(FakeCapturer.class, NativeFullPageCapturerLoader.load(loader).getClass());
  }

  @Test
  void returnsNullWithoutImplementationTest() {
    // A class loader that sees no META-INF/services entries (default).
    assertNull(NativeFullPageCapturerLoader.load(new ClassLoader(null) {}));
  }

  /**
   * A class loader that sees the test classes plus a temporary directory holding a
   * META-INF/services file that registers the given implementations, in order.
   */
  private ClassLoader classLoaderRegistering(String... implementations) throws IOException {
    Path services = tempDir.resolve("META-INF/services");
    Files.createDirectories(services);
    Files.write(
        services.resolve(NativeFullPageCapturer.class.getName()),
        Arrays.asList(implementations),
        StandardCharsets.UTF_8);
    return new URLClassLoader(
        new URL[] {tempDir.toUri().toURL()},
        NativeFullPageCapturerLoaderTest.class.getClassLoader());
  }
}
