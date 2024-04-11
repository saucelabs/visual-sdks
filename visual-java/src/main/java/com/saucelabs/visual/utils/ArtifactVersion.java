package com.saucelabs.visual.utils;

import java.util.Optional;
import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ArtifactVersion {
  private static final Logger log = LoggerFactory.getLogger(ArtifactVersion.class);

  public static Optional<String> getArtifactVersion() {
    try {
      Properties props = new Properties();
      props.load(
          ArtifactVersion.class
              .getClassLoader()
              .getResourceAsStream("com/saucelabs/visual/utils/pom.properties"));
      return Optional.of(props.getProperty("version"));
    } catch (Exception e) {
      log.error("unable to parse version from jar", e);
    }

    return Optional.empty();
  }
}
