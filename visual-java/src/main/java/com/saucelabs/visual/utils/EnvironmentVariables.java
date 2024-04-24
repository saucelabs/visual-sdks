package com.saucelabs.visual.utils;

import java.util.Optional;

public class EnvironmentVariables {

  private EnvironmentVariables() {}

  public static final String PROJECT_NAME =
      Optional.of(System.getenv("SAUCE_VISUAL_PROJECT")).orElse("");
  public static final String BRANCH_NAME =
      Optional.of(System.getenv("SAUCE_VISUAL_BRANCH")).orElse("");
  public static final String DEFAULT_BRANCH_NAME =
      Optional.of(System.getenv("SAUCE_VISUAL_DEFAULT_BRANCH")).orElse("");
  public static final String BUILD_NAME =
      Optional.of(System.getenv("SAUCE_VISUAL_BUILD_NAME")).orElse("");
  public static final String BUILD_ID =
      Optional.of(System.getenv("SAUCE_VISUAL_BUILD_ID")).orElse("");
  public static final String CUSTOM_ID =
      Optional.of(System.getenv("SAUCE_VISUAL_CUSTOM_ID")).orElse("");

  public static final String BUILD_NAME_DEPRECATED = System.getenv("BUILD_NAME");

  public static boolean isNotBlank(String str) {
    return str != null && !str.trim().isEmpty();
  }

  public static String valueOrDefault(String str, String defaultValue) {
    return isNotBlank(str) ? str : defaultValue;
  }
}
