package com.saucelabs.visual.utils;

import com.saucelabs.visual.graphql.type.Browser;
import com.saucelabs.visual.graphql.type.OperatingSystem;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.Platform;

public class CapabilityUtils {
  public static Browser getBrowser(Capabilities caps) {
    switch (caps.getBrowserName()) {
      case "chrome":
        return Browser.CHROME;
      case "edge":
        return Browser.EDGE;
      case "firefox":
        return Browser.FIREFOX;
      case "safari":
        return Browser.SAFARI;
      default:
        return Browser.NONE;
    }
  }

  public static OperatingSystem getOperatingSystem(Capabilities caps) {
    Platform platform = caps.getPlatformName();
    Platform family = platform.family();
    // Android / iOS have null families, so return the family (Windows) if it exists,
    // otherwise use the platform name as a fallback
    switch (family != null ? family : platform) {
      case MAC:
        return OperatingSystem.MACOS;
      case UNIX:
        return OperatingSystem.LINUX;
      case WINDOWS:
        return OperatingSystem.WINDOWS;
      case ANDROID:
        return OperatingSystem.ANDROID;
      case IOS:
        return OperatingSystem.IOS;
      default:
        return OperatingSystem.UNKNOWN;
    }
  }
}
