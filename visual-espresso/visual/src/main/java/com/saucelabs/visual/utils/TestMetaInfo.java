package com.saucelabs.visual.utils;

import androidx.annotation.NonNull;

public class TestMetaInfo {

    /**
     * Set this thread local object to pass the TestMetaInfo from your testing framework to the
     * VisualApi
     */
    public static final ThreadLocal<TestMetaInfo> THREAD_LOCAL =
            new ThreadLocal<>() {
                @Override
                protected TestMetaInfo initialValue() {
                    return null;
                }
            };

    private final String testSuite;
    private final String testName;

    public TestMetaInfo(String testSuite, String testName) {
        this.testSuite = testSuite;
        this.testName = testName;
    }

    public String getTestSuite() {
        return testSuite;
    }

    public String getTestName() {
        return testName;
    }

    @NonNull
    @Override
    public String toString() {
        return "TestMetaInfo{"
                + "testSuite='"
                + testSuite
                + '\''
                + ", testName='"
                + testName
                + '\''
                + '}';
    }
}
