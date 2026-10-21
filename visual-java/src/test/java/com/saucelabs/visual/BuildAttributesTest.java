package com.saucelabs.visual;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.saucelabs.visual.VisualApi.BuildAttributes;
import com.saucelabs.visual.utils.EnvironmentVariableProvider;
import org.junit.jupiter.api.Test;

class BuildAttributesTest {

  @Test
  void getBuildId_returnsExplicitValueWhenProvided() {
    BuildAttributes attrs =
        new BuildAttributes("name", "project", "branch", "main", "explicit-build-id", null);

    assertEquals("explicit-build-id", attrs.getBuildId());
  }

  @Test
  void getCustomId_returnsExplicitValueWhenProvided() {
    BuildAttributes attrs =
        new BuildAttributes("name", "project", "branch", "main", null, "explicit-custom-id");

    assertEquals("explicit-custom-id", attrs.getCustomId());
  }

  @Test
  void getBuildId_andGetCustomId_areIndependent() {
    BuildAttributes attrs = new BuildAttributes("name", "project", "branch", "main", "bid", "cid");

    assertEquals("bid", attrs.getBuildId());
    assertEquals("cid", attrs.getCustomId());
  }

  @Test
  void getBuildId_fallsBackToEnvWhenNotProvided() {
    EnvironmentVariableProvider env = mock(EnvironmentVariableProvider.class);
    when(env.getBuildId()).thenReturn("env-build-id");

    BuildAttributes attrs = new BuildAttributes(null, null, null, null, null, null, env);

    assertEquals("env-build-id", attrs.getBuildId());
  }

  @Test
  void getCustomId_fallsBackToEnvWhenNotProvided() {
    EnvironmentVariableProvider env = mock(EnvironmentVariableProvider.class);
    when(env.getCustomId()).thenReturn("env-custom-id");

    BuildAttributes attrs = new BuildAttributes(null, null, null, null, null, null, env);

    assertEquals("env-custom-id", attrs.getCustomId());
  }

  @Test
  void getBuildId_explicitValueWinsOverEnv() {
    EnvironmentVariableProvider env = mock(EnvironmentVariableProvider.class);
    when(env.getBuildId()).thenReturn("env-build-id");

    BuildAttributes attrs =
        new BuildAttributes(null, null, null, null, "client-build-id", null, env);

    assertEquals("client-build-id", attrs.getBuildId());
  }

  @Test
  void getBuildId_returnsNullWhenNeitherSet() {
    EnvironmentVariableProvider env = mock(EnvironmentVariableProvider.class);
    when(env.getBuildId()).thenReturn(null);

    BuildAttributes attrs = new BuildAttributes(null, null, null, null, null, null, env);

    assertNull(attrs.getBuildId());
  }
}
