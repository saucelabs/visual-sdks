package com.saucelabs.visual.utils;

public class EnvironmentVariables {

    private EnvironmentVariables() {
    }

    public static final String SAUCE_USERNAME = System.getenv("SAUCE_USERNAME");
    public static final String SAUCE_ACCESS_KEY = System.getenv("SAUCE_ACCESS_KEY");
    public static final String SAUCE_REGION = System.getenv("SAUCE_REGION");

    public static final String PROJECT_NAME = System.getenv("SAUCE_VISUAL_PROJECT");
    public static final String BRANCH_NAME = System.getenv("SAUCE_VISUAL_BRANCH");
    public static final String DEFAULT_BRANCH_NAME = System.getenv("SAUCE_VISUAL_DEFAULT_BRANCH");
    public static final String BUILD_NAME = System.getenv("SAUCE_VISUAL_BUILD_NAME");
}
