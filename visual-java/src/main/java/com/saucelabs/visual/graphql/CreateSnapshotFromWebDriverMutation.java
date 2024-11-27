package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.DiffingMethod;
import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.graphql.type.DiffsConnection;
import com.saucelabs.visual.graphql.type.ElementIn;
import com.saucelabs.visual.graphql.type.IgnoreSelectorIn;
import com.saucelabs.visual.graphql.type.RegionIn;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebElement;

public class CreateSnapshotFromWebDriverMutation implements GraphQLOperation {
  public static final String OPERATION_DOCUMENT =
      "mutation createSnapshotFromWebDriver($input: CreateSnapshotFromWebDriverIn!) { result: createSnapshotFromWebDriver(input: $input) { id uploadId diffs { nodes { id __typename baselineId snapshotId status diffBounds { x y width height } diffClusters { x y width height } } } } }";

  public static class CreateSnapshotFromWebDriverIn {

    public final String buildUuid;

    public final DiffingMethod diffingMethod;

    public final List<RegionIn> ignoreRegions;

    public final List<ElementIn> ignoreElements;

    public final List<IgnoreSelectorIn> ignoreSelectors;

    public final String jobId;

    public final String name;

    public final String sessionId;

    public final String sessionMetadata;

    public Optional<String> suiteName = Optional.empty();

    public Optional<String> testName = Optional.empty();

    public Optional<Boolean> captureDom = Optional.empty();

    public Optional<String> clipSelector = Optional.empty();

    public Optional<String> clipElement = Optional.empty();

    public Optional<FullPageScreenshotConfig> fullPageConfig = Optional.empty();

    public Optional<DiffingOptionsIn> diffingOptions = Optional.empty();

    public CreateSnapshotFromWebDriverIn(
        String buildUuid,
        DiffingMethod diffingMethod,
        Optional<DiffingOptionsIn> diffingOptions,
        List<RegionIn> ignoreRegions,
        List<ElementIn> ignoreElements,
        String jobId,
        String name,
        String sessionId,
        String sessionMetadata,
        List<IgnoreSelectorIn> ignoreSelectors) {
      this.buildUuid = buildUuid;
      this.diffingMethod = diffingMethod;
      this.diffingOptions = diffingOptions;
      this.ignoreRegions = ignoreRegions;
      this.ignoreElements = ignoreElements;
      this.ignoreSelectors = ignoreSelectors;
      this.jobId = jobId;
      this.name = name;
      this.sessionId = sessionId;
      this.sessionMetadata = sessionMetadata;
    }

    public void setTestName(String testName) {
      this.testName = Optional.of(testName);
    }

    public void setSuiteName(String suiteName) {
      this.suiteName = Optional.of(suiteName);
    }

    public void setCaptureDom(Boolean captureDom) {
      this.captureDom = Optional.of(captureDom);
    }

    public void setClipSelector(String clipSelector) {
      this.clipSelector = Optional.of(clipSelector);
    }

    public void setClipElement(WebElement clipElement) {
      this.clipElement = Optional.of(((RemoteWebElement) clipElement).getId());
    }

    public void setFullPageConfig(FullPageScreenshotConfig fullPageConfig) {
      this.fullPageConfig = Optional.ofNullable(fullPageConfig);
    }

    public void setDiffingOptions(DiffingOptionsIn diffingOptions) {
      this.diffingOptions = Optional.of(diffingOptions);
    }
  }

  public static class Data {

    public final Result result;

    @JsonCreator
    public Data(@JsonProperty("result") Result result) {
      this.result = result;
    }

    @Override
    public String toString() {
      return "CreateSnapshotFromWebDriverMutation.Data{" + "result=" + result + '}';
    }
  }

  public static class Result {
    public String id;

    public String uploadId;

    /** Reads and enables pagination through a set of `Diff`. */
    public DiffsConnection diffs;

    @JsonCreator
    public Result(
        @JsonProperty("id") String id,
        @JsonProperty("uploadId") String uploadId,
        @JsonProperty("diffs") DiffsConnection diffs) {
      this.id = id;
      this.uploadId = uploadId;
      this.diffs = diffs;
    }

    @Override
    public String toString() {
      return "CreateSnapshotFromWebDriverMutation.Result{"
          + "id='"
          + id
          + '\''
          + ", uploadId='"
          + uploadId
          + '\''
          + ", diffs="
          + diffs
          + '}';
    }
  }

  private final CreateSnapshotFromWebDriverIn input;

  public CreateSnapshotFromWebDriverMutation(CreateSnapshotFromWebDriverIn input) {
    this.input = input;
  }

  @Override
  public String getQuery() {
    return OPERATION_DOCUMENT;
  }

  @Override
  public Map<String, Object> getVariables() {
    return Collections.singletonMap("input", input);
  }
}
