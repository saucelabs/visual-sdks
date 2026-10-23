package com.saucelabs.visual.utils;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class EnvironmentVariables {

  private EnvironmentVariables() {}

  public static final String SAUCE_REGION = System.getenv("SAUCE_REGION");

  public static final String PROJECT_NAME = System.getenv("SAUCE_VISUAL_PROJECT");
  public static final String BRANCH_NAME = System.getenv("SAUCE_VISUAL_BRANCH");
  public static final String DEFAULT_BRANCH_NAME = System.getenv("SAUCE_VISUAL_DEFAULT_BRANCH");
  public static final String BUILD_NAME = System.getenv("SAUCE_VISUAL_BUILD_NAME");
  public static final String BUILD_ID = System.getenv("SAUCE_VISUAL_BUILD_ID");
  public static final String CUSTOM_ID = System.getenv("SAUCE_VISUAL_CUSTOM_ID");
  public static final String TAGS = System.getenv("SAUCE_VISUAL_TAGS");

  public static final String BUILD_NAME_DEPRECATED = System.getenv("BUILD_NAME");

  public static boolean isNotBlank(String str) {
    return str != null && !str.trim().isEmpty();
  }

  public static String valueOrDefault(String str, String defaultValue) {
    return isNotBlank(str) ? str : defaultValue;
  }

  /**
   * Parses a comma separated list of tags (ex: from {@code SAUCE_VISUAL_TAGS}). Tags containing a
   * comma cannot be expressed this way and should be supplied through the SDK options instead.
   *
   * @return the trimmed, non-empty tags, or {@code null} when there are none
   */
  public static List<String> parseTags(String tags) {
    if (tags == null) {
      return null;
    }
    List<String> parsed =
        Arrays.stream(tags.split(","))
            .map(String::trim)
            .filter(tag -> !tag.isEmpty())
            .collect(Collectors.toList());
    return parsed.isEmpty() ? null : parsed;
  }
}
