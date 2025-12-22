package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.*;
import com.saucelabs.visual.model.DiffingMethodSensitivity;
import com.saucelabs.visual.model.DiffingMethodTolerance;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import java.util.*;
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

    public Optional<String> clipElement = Optional.empty();

    public Optional<FullPageScreenshotConfig> fullPageConfig = Optional.empty();

    public Optional<DiffingOptionsIn> diffingOptions = Optional.empty();

    public Optional<Boolean> hideScrollBars = Optional.empty();

    public Optional<com.saucelabs.visual.graphql.type.DiffingMethodSensitivity>
        diffingMethodSensitivity = Optional.empty();

    public Optional<DiffingMethodToleranceIn> diffingMethodTolerance = Optional.empty();

    public CreateSnapshotFromWebDriverIn(
        String buildUuid,
        DiffingMethod diffingMethod,
        Optional<DiffingOptionsIn> diffingOptions,
        List<RegionIn> ignoreRegions,
        List<ElementIn> ignoreElements,
        String jobId,
        String name,
        String sessionId,
        String sessionMetadata) {
      this(
          buildUuid,
          diffingMethod,
          diffingOptions,
          ignoreRegions,
          ignoreElements,
          jobId,
          name,
          sessionId,
          sessionMetadata,
          null);
    }

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
      this.testName = Optional.ofNullable(testName);
    }

    public void setSuiteName(String suiteName) {
      this.suiteName = Optional.ofNullable(suiteName);
    }

    public void setCaptureDom(Boolean captureDom) {
      this.captureDom = Optional.of(captureDom);
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

    public void setDiffingMethodSensitivity(DiffingMethodSensitivity diffingMethodSensitivity) {
      this.diffingMethodSensitivity =
          Optional.of(diffingMethodSensitivity).map(DiffingMethodSensitivity::asGraphQLType);
    }

    public void setDiffingMethodTolerance(DiffingMethodTolerance diffingMethodTolerance) {
      this.diffingMethodTolerance =
          Optional.of(diffingMethodTolerance).map(DiffingMethodTolerance::asGraphQLType);
    }

    public void setHideScrollBars(Boolean hideScrollBars) {
      this.hideScrollBars = Optional.of(hideScrollBars);
    }
  }

  public static class Data {

    public final SnapshotDiffResult result;

    @JsonCreator
    public Data(@JsonProperty("result") SnapshotDiffResult result) {
      this.result = result;
    }

    @Override
    public String toString() {
      return "CreateSnapshotFromWebDriverMutation.Data{" + "result=" + result + '}';
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
