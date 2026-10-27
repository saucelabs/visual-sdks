package com.saucelabs.visual.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Arrays;
import java.util.Collections;
import org.junit.jupiter.api.Test;

class EnvironmentVariablesTest {

  @Test
  void parseTagsSplitsAndTrims() {
    assertEquals(
        Arrays.asList("smoke", "nightly", "checkout"),
        EnvironmentVariables.parseTags(" smoke, nightly ,checkout "));
    assertEquals(Collections.singletonList("smoke"), EnvironmentVariables.parseTags("smoke"));
  }

  @Test
  void parseTagsDropsEmptyEntries() {
    assertEquals(Arrays.asList("a", "b"), EnvironmentVariables.parseTags("a,,  ,b,"));
  }

  @Test
  void parseTagsReturnsNullWhenThereAreNone() {
    assertNull(EnvironmentVariables.parseTags(null));
    assertNull(EnvironmentVariables.parseTags(""));
    assertNull(EnvironmentVariables.parseTags(" , ,"));
  }
}
