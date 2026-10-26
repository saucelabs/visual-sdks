package com.saucelabs.visual;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.SessionId;

class VisualApiBuilderTest {

  private VisualApi.Builder builder() {
    RemoteWebDriver driver = mock(RemoteWebDriver.class);
    when(driver.getSessionId()).thenReturn(new SessionId("sid"));
    return new VisualApi.Builder(driver, "u", "k", "http://localhost");
  }

  @Test
  void withFinishDelay_withoutCustomId_throwsIllegalStateException() {
    assertThrows(
        IllegalStateException.class, () -> builder().withBuildFinishDelay(Duration.ofSeconds(30)));
  }

  @Test
  void withFinishDelay_withBlankCustomId_throwsIllegalStateException() {
    assertThrows(
        IllegalStateException.class,
        () -> builder().withCustomId("").withBuildFinishDelay(Duration.ofSeconds(30)));
  }

  @Test
  void withFinishDelay_withNegativeDuration_throwsIllegalArgumentException() {
    assertThrows(
        IllegalArgumentException.class,
        () -> builder().withCustomId("id").withBuildFinishDelay(Duration.ofSeconds(-1)));
  }

  @Test
  void withFinishDelay_afterCustomId_succeeds() {
    assertDoesNotThrow(
        () -> builder().withCustomId("id").withBuildFinishDelay(Duration.ofSeconds(30)));
  }

  @Test
  void withFinishDelay_nullDelayAfterCustomId_succeeds() {
    assertDoesNotThrow(() -> builder().withCustomId("id").withBuildFinishDelay(null));
  }
}
