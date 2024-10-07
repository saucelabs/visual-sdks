package com.saucelabs.visual;

import java.util.Optional;

public class TestMetaInfo {

  /**
   * Set this thread local object to pass the TestMetaInfo from your testing framework to the
   * VisualApi
   */
  public static final ThreadLocal<Optional<TestMetaInfo>> THREAD_LOCAL =
      ThreadLocal.withInitial(Optional::empty);

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
