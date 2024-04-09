package com.saucelabs.visual.testng;

import com.saucelabs.visual.TestMetaInfo;
import java.util.Optional;
import org.testng.ITestListener;
import org.testng.ITestResult;

public class TestMetaInfoListener implements ITestListener {
  @Override
  public void onTestStart(ITestResult result) {
    String testSuite = result.getMethod().getTestClass().getName();
    String testName = result.getMethod().getMethodName();

    TestMetaInfo.THREAD_LOCAL.set(Optional.of(new TestMetaInfo(testSuite, testName)));
  }

  @Override
  public void onTestSuccess(ITestResult result) {
    TestMetaInfo.THREAD_LOCAL.set(Optional.empty());
  }

  @Override
  public void onTestFailure(ITestResult result) {
    TestMetaInfo.THREAD_LOCAL.set(Optional.empty());
  }

  @Override
  public void onTestFailedWithTimeout(ITestResult result) {
    TestMetaInfo.THREAD_LOCAL.set(Optional.empty());
  }

  @Override
  public void onTestFailedButWithinSuccessPercentage(ITestResult result) {
    TestMetaInfo.THREAD_LOCAL.set(Optional.empty());
  }

  @Override
  public void onTestSkipped(ITestResult result) {
    TestMetaInfo.THREAD_LOCAL.set(Optional.empty());
  }
}
