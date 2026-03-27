package com.saucelabs.visual.model;

public enum OperatingSystem {
  ANDROID,
  IOS,
  LINUX,
  MACOS,
  UNKNOWN,
  WINDOWS;

  public com.saucelabs.visual.graphql.type.OperatingSystem asGraphQLType() {
    switch (this) {
      case ANDROID:
        return com.saucelabs.visual.graphql.type.OperatingSystem.ANDROID;
      case IOS:
        return com.saucelabs.visual.graphql.type.OperatingSystem.IOS;
      case LINUX:
        return com.saucelabs.visual.graphql.type.OperatingSystem.LINUX;
      case MACOS:
        return com.saucelabs.visual.graphql.type.OperatingSystem.MACOS;
      case UNKNOWN:
        return com.saucelabs.visual.graphql.type.OperatingSystem.UNKNOWN;
      case WINDOWS:
        return com.saucelabs.visual.graphql.type.OperatingSystem.WINDOWS;
    }
    return null;
  }
}
