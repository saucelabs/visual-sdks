package com.saucelabs.visual.testng;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.saucelabs.visual.TestMetaInfo;
import org.testng.annotations.Listeners;
import org.testng.annotations.Test;

@Listeners({TestMetaInfoListener.class})
public class TestMetaInfoListenerTest {

  @Test
  public void checkTestMetaInfoIsAvailable() {
    assertEquals(
        "com.saucelabs.visual.testng.TestMetaInfoListenerTest",
        TestMetaInfo.THREAD_LOCAL.get().get().getTestSuite());
    assertEquals(
        "checkTestMetaInfoIsAvailable", TestMetaInfo.THREAD_LOCAL.get().get().getTestName());
  }
}
