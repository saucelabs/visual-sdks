package com.saucelabs.visual.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class ArtifactVersionTest {

  @Test
  @Disabled
  public void testVersionParsing() {
    // during a release $VERSION is used to change the artifact version
    String versionFromEnv = System.getenv("VERSION");
    String expectedVersion = versionFromEnv != null ? versionFromEnv : "0.0.1";
    assertEquals(expectedVersion, ArtifactVersion.getArtifactVersion().get());
  }
}
