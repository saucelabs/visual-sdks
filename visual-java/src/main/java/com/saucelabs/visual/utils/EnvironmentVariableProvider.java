package com.saucelabs.visual.utils;

/**
 * Instance-based accessor for Sauce Visual environment variables. Prefer this over the static
 * constants on {@link EnvironmentVariables} when the value needs to be swapped out in tests.
 */
public class EnvironmentVariableProvider {

  public static final EnvironmentVariableProvider DEFAULT = new EnvironmentVariableProvider();

  public String getSauceRegion() {
    return System.getenv("SAUCE_REGION");
  }

  public String getProjectName() {
    return System.getenv("SAUCE_VISUAL_PROJECT");
  }

  public String getBranchName() {
    return System.getenv("SAUCE_VISUAL_BRANCH");
  }

  public String getDefaultBranchName() {
    return System.getenv("SAUCE_VISUAL_DEFAULT_BRANCH");
  }

  public String getBuildName() {
    return System.getenv("SAUCE_VISUAL_BUILD_NAME");
  }

  public String getBuildId() {
    return System.getenv("SAUCE_VISUAL_BUILD_ID");
  }

  public String getCustomId() {
    return System.getenv("SAUCE_VISUAL_CUSTOM_ID");
  }

  public String getBuildNameDeprecated() {
    return System.getenv("BUILD_NAME");
  }
}
