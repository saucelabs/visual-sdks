package com.saucelabs.visual;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.saucelabs.visual.VisualApi.BuildAttributes;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.BuildByCustomIdQuery;
import com.saucelabs.visual.graphql.BuildQuery;
import com.saucelabs.visual.graphql.type.BuildMode;
import com.saucelabs.visual.utils.EnvironmentVariableProvider;
import org.junit.jupiter.api.Test;

class VisualBuildTest {

  private static BuildQuery.Result buildQueryResult(String id, BuildMode mode) {
    return new BuildQuery.Result(id, "name", "project", "branch", "main", "https://url", mode);
  }

  private static BuildByCustomIdQuery.Result customIdQueryResult(String id, BuildMode mode) {
    return new BuildByCustomIdQuery.Result(
        id, "name", "project", "branch", "main", "https://url", mode);
  }

  @Test
  void getExternalBuild_withBuildId_returnsBuildAndDoesNotQueryCustomId() {
    VisualApi api = mock(VisualApi.class);
    when(api.getBuildById("explicit-build-id"))
        .thenReturn(buildQueryResult("explicit-build-id", BuildMode.RUNNING));

    BuildAttributes attrs =
        new BuildAttributes(null, null, null, null, null, "explicit-build-id", "ignored-custom-id");

    VisualBuild result = VisualBuild.getExternalBuild(api, attrs);

    assertNotNull(result);
    assertEquals("explicit-build-id", result.getId());
    verify(api).getBuildById("explicit-build-id");
    verify(api, never()).getBuildByCustomId(eq("ignored-custom-id"));
  }

  @Test
  void getExternalBuild_withCustomId_returnsBuild() {
    VisualApi api = mock(VisualApi.class);
    when(api.getBuildByCustomId("explicit-custom-id"))
        .thenReturn(customIdQueryResult("resolved-custom-build-id", BuildMode.RUNNING));

    BuildAttributes attrs =
        new BuildAttributes(null, null, null, null, null, null, "explicit-custom-id");

    VisualBuild result = VisualBuild.getExternalBuild(api, attrs);

    assertNotNull(result);
    assertEquals("resolved-custom-build-id", result.getId());
    verify(api).getBuildByCustomId("explicit-custom-id");
  }

  @Test
  void getExternalBuild_withBuildId_whenBuildCompleted_throws() {
    VisualApi api = mock(VisualApi.class);
    when(api.getBuildById("explicit-build-id"))
        .thenReturn(buildQueryResult("explicit-build-id", BuildMode.COMPLETED));

    BuildAttributes attrs =
        new BuildAttributes(null, null, null, null, null, "explicit-build-id", null);

    assertThrows(VisualApiException.class, () -> VisualBuild.getExternalBuild(api, attrs));
  }

  @Test
  void getExternalBuild_withCustomId_whenBuildCompleted_throws() {
    VisualApi api = mock(VisualApi.class);
    when(api.getBuildByCustomId("explicit-custom-id"))
        .thenReturn(customIdQueryResult("resolved-build-id", BuildMode.COMPLETED));

    BuildAttributes attrs =
        new BuildAttributes(null, null, null, null, null, null, "explicit-custom-id");

    assertThrows(VisualApiException.class, () -> VisualBuild.getExternalBuild(api, attrs));
  }

  @Test
  void getExternalBuild_whenBuildIdLookupReturnsNull_fallsBackToCustomId() {
    VisualApi api = mock(VisualApi.class);
    when(api.getBuildById("missing-build-id")).thenReturn(null);
    when(api.getBuildByCustomId("explicit-custom-id"))
        .thenReturn(customIdQueryResult("resolved-build-id", BuildMode.RUNNING));

    BuildAttributes attrs =
        new BuildAttributes(null, null, null, null, null, "missing-build-id", "explicit-custom-id");

    VisualBuild result = VisualBuild.getExternalBuild(api, attrs);

    assertNotNull(result);
    assertEquals("resolved-build-id", result.getId());
    verify(api).getBuildById("missing-build-id");
    verify(api).getBuildByCustomId("explicit-custom-id");
  }

  @Test
  void getExternalBuild_whenNeitherLookupResolves_returnsNull() {
    VisualApi api = mock(VisualApi.class);
    when(api.getBuildById("missing-build-id")).thenReturn(null);
    when(api.getBuildByCustomId("missing-custom-id")).thenReturn(null);

    BuildAttributes attrs =
        new BuildAttributes(null, null, null, null, null, "missing-build-id", "missing-custom-id");

    assertNull(VisualBuild.getExternalBuild(api, attrs));
  }

  @Test
  void getExternalBuild_whenNoClientValuesAndNoEnv_returnsNullWithoutQueryingApi() {
    VisualApi api = mock(VisualApi.class);
    EnvironmentVariableProvider env = mock(EnvironmentVariableProvider.class);
    when(env.getBuildId()).thenReturn(null);
    when(env.getCustomId()).thenReturn(null);

    BuildAttributes attrs = new BuildAttributes(null, null, null, null, null, null, null, env);

    assertNull(VisualBuild.getExternalBuild(api, attrs));

    verify(api, never()).getBuildById(any());
    verify(api, never()).getBuildByCustomId(any());
  }

  @Test
  void getExternalBuild_whenNoClientValuesButEnvHasBuildId_usesEnvValue() {
    VisualApi api = mock(VisualApi.class);
    EnvironmentVariableProvider env = mock(EnvironmentVariableProvider.class);
    when(env.getBuildId()).thenReturn("env-build-id");
    when(api.getBuildById("env-build-id"))
        .thenReturn(buildQueryResult("env-build-id", BuildMode.RUNNING));

    BuildAttributes attrs = new BuildAttributes(null, null, null, null, null, null, null, env);

    VisualBuild result = VisualBuild.getExternalBuild(api, attrs);

    assertNotNull(result);
    assertEquals("env-build-id", result.getId());
    verify(api).getBuildById("env-build-id");
  }

  @Test
  void getExternalBuild_whenNoClientValuesButEnvHasCustomId_usesEnvValue() {
    VisualApi api = mock(VisualApi.class);
    EnvironmentVariableProvider env = mock(EnvironmentVariableProvider.class);
    when(env.getBuildId()).thenReturn(null);
    when(env.getCustomId()).thenReturn("env-custom-id");
    when(api.getBuildByCustomId("env-custom-id"))
        .thenReturn(customIdQueryResult("resolved-build-id", BuildMode.RUNNING));

    BuildAttributes attrs = new BuildAttributes(null, null, null, null, null, null, null, env);

    VisualBuild result = VisualBuild.getExternalBuild(api, attrs);

    assertNotNull(result);
    assertEquals("resolved-build-id", result.getId());
    verify(api).getBuildByCustomId("env-custom-id");
  }

  @Test
  void getExternalBuild_clientBuildIdWinsOverEnvBuildId() {
    VisualApi api = mock(VisualApi.class);
    EnvironmentVariableProvider env = mock(EnvironmentVariableProvider.class);
    when(env.getBuildId()).thenReturn("env-build-id");
    when(api.getBuildById("client-build-id"))
        .thenReturn(buildQueryResult("client-build-id", BuildMode.RUNNING));

    BuildAttributes attrs =
        new BuildAttributes(null, null, null, null, null, "client-build-id", null, env);

    VisualBuild result = VisualBuild.getExternalBuild(api, attrs);

    assertNotNull(result);
    assertEquals("client-build-id", result.getId());
    verify(api).getBuildById("client-build-id");
    verify(api, never()).getBuildById("env-build-id");
  }
}
