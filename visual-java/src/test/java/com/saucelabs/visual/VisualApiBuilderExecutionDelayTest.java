package com.saucelabs.visual;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.SessionId;

class VisualApiBuilderExecutionDelayTest {

  private VisualApi.Builder builder() {
    RemoteWebDriver driver = mock(RemoteWebDriver.class);
    when(driver.getSessionId()).thenReturn(new SessionId("sid"));
    return new VisualApi.Builder(driver, "u", "k", "http://localhost");
  }

  // setter proper values

  @Test
  void withBuildFinishDelay_negativeDuration_throwsIllegalArgumentException() {
    assertThrows(
        IllegalArgumentException.class,
        () -> builder().withBuildFinishDelay(Duration.ofSeconds(-1)));
  }

  @Test
  void withBuildFinishDelay_nullIsAccepted() {
    assertDoesNotThrow(() -> builder().withBuildFinishDelay(null));
  }

  @Test
  void withBuildFinishDelay_positiveDuration_doesNotThrowAtSetter() {
    assertDoesNotThrow(() -> builder().withBuildFinishDelay(Duration.ofSeconds(60)));
  }

  // custom id + execution delay validation
  @Test
  void validate_passesWithNeitherCustomIdNorFinishDelay() {
    assertDoesNotThrow(() -> builder().validate());
  }

  @Test
  void validate_passesWithCustomIdOnly() {
    assertDoesNotThrow(() -> builder().withCustomId("ci-run").validate());
  }

  @Test
  void validate_passesWithCustomIdAndFinishDelay() {
    assertDoesNotThrow(
        () ->
            builder()
                .withCustomId("ci-run")
                .withBuildFinishDelay(Duration.ofSeconds(60))
                .validate());
  }

  @Test
  void validate_throwsWhenFinishDelaySetWithoutCustomId() {
    assertThrows(
        IllegalStateException.class,
        () -> builder().withBuildFinishDelay(Duration.ofSeconds(60)).validate());
  }

  @Test
  void validate_throwsWhenFinishDelaySetWithBlankCustomId() {
    assertThrows(
        IllegalStateException.class,
        () ->
            builder().withCustomId("   ").withBuildFinishDelay(Duration.ofSeconds(60)).validate());
  }
}
