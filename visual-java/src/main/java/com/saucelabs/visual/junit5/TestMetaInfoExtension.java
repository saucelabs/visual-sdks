package com.saucelabs.visual.junit5;

import com.saucelabs.visual.TestMetaInfo;
import java.util.Optional;
import org.junit.jupiter.api.extension.AfterTestExecutionCallback;
import org.junit.jupiter.api.extension.BeforeTestExecutionCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

public class TestMetaInfoExtension
    implements BeforeTestExecutionCallback, AfterTestExecutionCallback {
  @Override
  public void beforeTestExecution(ExtensionContext context) throws Exception {
    String className = context.getRequiredTestClass().getName();
    String testName = context.getRequiredTestMethod().getName();

    TestMetaInfo.THREAD_LOCAL.set(Optional.of(new TestMetaInfo(className, testName)));
  }

  @Override
  public void afterTestExecution(ExtensionContext context) throws Exception {
    TestMetaInfo.THREAD_LOCAL.set(Optional.empty());
  }
}
