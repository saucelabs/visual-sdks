package com.saucelabs.visual;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.saucelabs.visual.graphql.DiffsForTestResultQuery;
import com.saucelabs.visual.graphql.GraphQLClient;
import com.saucelabs.visual.graphql.type.DiffStatus;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.platform.commons.util.ReflectionUtils;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.SessionId;

class VisualApiTest {

  @Test
  void sauceVisualResultsTest() throws IllegalAccessException {
    RemoteWebDriver driver = mock(RemoteWebDriver.class);
    when(driver.getSessionId()).thenReturn(new SessionId(""));
    VisualApi api =
        new VisualApi(
            "", driver, new VisualBuild(null, null, null, null, null, null), "", "", "u", "k");
    GraphQLClient mockGraphQLClient = mock(GraphQLClient.class);
    when(mockGraphQLClient.execute(any(), any()))
        .thenReturn(
            new DiffsForTestResultQuery.Data(
                new DiffsForTestResultQuery.Result(
                    Collections.singletonList(
                        new DiffsForTestResultQuery.Node("id", DiffStatus.QUEUED)))))
        .thenReturn(
            new DiffsForTestResultQuery.Data(
                new DiffsForTestResultQuery.Result(
                    Collections.singletonList(
                        new DiffsForTestResultQuery.Node("id", DiffStatus.UNAPPROVED)))));
    List<String> uploadedDiffIds = new ArrayList<>(Arrays.asList("id"));
    setField(api, "client", mockGraphQLClient);
    setField(api, "uploadedDiffIds", uploadedDiffIds);
    assertEquals(1, api.sauceVisualResults().get(DiffStatus.UNAPPROVED));
  }

  public static <T> void setField(T clazz, String fieldName, Object value)
      throws IllegalAccessException {
    Field field =
        ReflectionUtils.findFields(
                clazz.getClass(),
                f -> f.getName().equals(fieldName),
                ReflectionUtils.HierarchyTraversalMode.TOP_DOWN)
            .get(0);
    field.setAccessible(true);
    field.set(clazz, value);
  }
}
