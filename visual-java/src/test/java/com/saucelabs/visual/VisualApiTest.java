package com.saucelabs.visual;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.saucelabs.visual.graphql.*;
import com.saucelabs.visual.graphql.type.Diff;
import com.saucelabs.visual.graphql.type.DiffStatus;
import com.saucelabs.visual.graphql.type.DiffsConnection;
import com.saucelabs.visual.graphql.type.SnapshotUpload;
import com.saucelabs.visual.utils.BulkDriverHelper;
import java.lang.reflect.Field;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.platform.commons.util.ReflectionUtils;
import org.mockito.ArgumentMatchers;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.SessionId;

class VisualApiTest {
  VisualApi api;
  GraphQLClient mockGraphQLClient;
  RemoteWebDriver mockDriver;
  BulkDriverHelper mockDriverHelper;

  @BeforeEach
  void setUp() throws IllegalAccessException {
    mockDriver = mock(RemoteWebDriver.class);

    MutableCapabilities caps = new MutableCapabilities();
    caps.setCapability("browserName", "chrome");
    caps.setCapability("browserVersion", "130");
    caps.setCapability("platformName", "Windows 10");

    when(mockDriver.getCapabilities()).thenReturn(caps);
    when(mockDriver.getSessionId()).thenReturn(new SessionId(""));
    api =
        new VisualApi(
            "", mockDriver, new VisualBuild(null, null, null, null, null, null), "", "", "u", "k");

    mockGraphQLClient = mock(GraphQLClient.class);
    setField(api, "client", mockGraphQLClient);
    mockDriverHelper = mock(BulkDriverHelper.class);
    setField(api, "bulkDriverHelper", mockDriverHelper);
  }

  @Test
  void sauceVisualResultsTest() throws IllegalAccessException {
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
    setField(api, "uploadedDiffIds", uploadedDiffIds);
    assertEquals(1, api.sauceVisualResults().get(DiffStatus.UNAPPROVED));
  }

  @Test
  void visualCheckSauceTest() throws IllegalAccessException {
    String mockVisualId = "sauce-test-id";
    String mockDiffId = "diff-id";
    setField(api, "isSauceSession", true);
    when(mockDriverHelper.areDisplayed(any())).thenReturn(new ArrayList<>());
    when(mockGraphQLClient.execute(
            any(CreateSnapshotFromWebDriverMutation.class),
            ArgumentMatchers.eq(CreateSnapshotFromWebDriverMutation.Data.class)))
        .thenReturn(
            new CreateSnapshotFromWebDriverMutation.Data(
                new SnapshotDiffResult(
                    mockVisualId,
                    "upload-id",
                    DiffsConnection.builder()
                        .withNodes(List.of(Diff.builder().withId(mockDiffId).build()))
                        .build())));

    String result = api.sauceVisualCheck("test name");
    assertEquals(mockVisualId, result);
    List<String> uploadedIds = (List<String>) getField(api, "uploadedDiffIds");
    assertEquals(uploadedIds, List.of(mockDiffId));
  }

  @Test
  void visualCheckLocalTest() throws IllegalAccessException {
    String mockLocalId = "local-test-id";
    String mockDiffId = "diff-id";
    setField(api, "isSauceSession", false);
    when(mockDriver.getScreenshotAs(OutputType.BYTES))
        .thenReturn(
            Base64.getDecoder()
                .decode(
                    "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDkuMC1jMDAwIDc5LmRhNGE3ZTVlZiwgMjAyMi8xMS8yMi0xMzo1MDowNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI0LjEgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NkNCNjBCQzFBRUY4MTFFREIwRThFMzc3OTlDRTMyNUIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NkNCNjBCQzJBRUY4MTFFREIwRThFMzc3OTlDRTMyNUIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2Q0I2MEJCRkFFRjgxMUVEQjBFOEUzNzc5OUNFMzI1QiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2Q0I2MEJDMEFFRjgxMUVEQjBFOEUzNzc5OUNFMzI1QiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pk+UPxEAAAFzSURBVHjaYvz//z/DQAImhgEGow4YcAewYBN8/uKFwsRZs+qpZQk/H++HhIioiZIS4g+IcsD85csK5ixbmkBNnwJzG2NVYVEBUVFgYWJ6gNpBjctMrA5wsrXdUJSePpFaljeUljaCzMQmx4ivIIpKS9u/69BBB0osd7e3P7B05ixHXPJ4HfAMmBiDExP2375/X4Ecy1UVFR+snb/QUQpL4iPKASBw884dA2sf7/PkOODSgUOK+CwnqhxQV1G50NfUVEiq5f1APYQsJ7ogigsLn5AcGbmQWMtBCTgWqIcYtYzE1oafv3wRcAsNOU8oPYDifdfqNYa8PDwfqOoAWKJ0DAw4//b9ewFs8sKCgh/2r99oSEzQk1UXSElIPJje1Z2IS76rtq6QFMvJqoxABUqory9GoRLi7b3R38trAV1qQz4eno/oYgL8Au9H2wOjDhh1wPBplBIC+ekZDYyMTChleF5aeiM5ZjGOds1GHTDQDgAIMADMF4VLIIxZXQAAAABJRU5ErkJggg=="));
    when(mockDriver.executeScript(any(String.class))).thenReturn(new HashMap<>());
    when(mockDriverHelper.areDisplayed(any())).thenReturn(new ArrayList<>());
    when(mockGraphQLClient.execute(
            any(CreateSnapshotUploadMutation.class),
            ArgumentMatchers.eq(CreateSnapshotUploadMutation.Data.class)))
        .thenReturn(
            new CreateSnapshotUploadMutation.Data(
                SnapshotUpload.builder().withImageUploadUrl("test-url").build()));
    when(mockGraphQLClient.execute(
            any(CreateSnapshotMutation.class),
            ArgumentMatchers.eq(CreateSnapshotMutation.Data.class)))
        .thenReturn(
            new CreateSnapshotMutation.Data(
                new SnapshotDiffResult(
                    mockLocalId,
                    "upload-id",
                    DiffsConnection.builder()
                        .withNodes(List.of(Diff.builder().withId(mockDiffId).build()))
                        .build())));

    String result = api.sauceVisualCheck("test name");
    assertEquals(mockLocalId, result);
    List<String> uploadedIds = (List<String>) getField(api, "uploadedDiffIds");
    assertEquals(uploadedIds, List.of(mockDiffId));
  }

  public static <T> Object getField(T clazz, String fieldName) throws IllegalAccessException {
    Field field =
        ReflectionUtils.findFields(
                clazz.getClass(),
                f -> f.getName().equals(fieldName),
                ReflectionUtils.HierarchyTraversalMode.TOP_DOWN)
            .get(0);
    field.setAccessible(true);
    return field.get(clazz);
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
