package com.saucelabs.visual.junit5;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.saucelabs.visual.TestMetaInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith({TestMetaInfoExtension.class})
public class TestMetaInfoExtensionTest {

  @Test
  public void checkTestMetaInfoIsAvailable() {
    assertEquals(
        "com.saucelabs.visual.junit5.TestMetaInfoExtensionTest",
        TestMetaInfo.THREAD_LOCAL.get().get().getTestSuite());
    assertEquals(
        "checkTestMetaInfoIsAvailable", TestMetaInfo.THREAD_LOCAL.get().get().getTestName());
  }
}
