package com.saucelabs.visual;

import static com.saucelabs.visual.utils.EnvironmentVariables.isNotBlank;
import static com.saucelabs.visual.utils.EnvironmentVariables.valueOrDefault;

import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.*;
import com.saucelabs.visual.graphql.type.*;
import com.saucelabs.visual.model.FullPageScreenshotConfig;
import com.saucelabs.visual.model.IgnoreRegion;
import com.saucelabs.visual.model.VisualRegion;
import com.saucelabs.visual.utils.ConsoleColors;
import com.saucelabs.visual.utils.EnvironmentVariables;
import dev.failsafe.Failsafe;
import dev.failsafe.RetryPolicy;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.RemoteWebElement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class VisualApi {
  private static final Logger log = LoggerFactory.getLogger(VisualApi.class);

  private static String resolveEndpoint() {
    return DataCenter.fromSauceRegion(EnvironmentVariables.SAUCE_REGION).endpoint;
  }

  /** Creates a VisualApi instance using builder style */
  public static class Builder {
    private final RemoteWebDriver driver;
    private final String username;
    private final String accessKey;
    private final String endpoint;
    private String projectName;
    private String branchName;
    private String defaultBranchName;
    private String buildName;
    private Boolean captureDom;
    private FullPageScreenshotConfig fullPageScreenshotConfig;

    public Builder(RemoteWebDriver driver, String username, String accessKey) {
      this(driver, username, accessKey, resolveEndpoint());
    }

    public Builder(RemoteWebDriver driver, String username, String accessKey, DataCenter region) {
      this(driver, username, accessKey, region.endpoint);
    }

    public Builder(RemoteWebDriver driver, String username, String accessKey, String endpoint) {
      this.driver = driver;
      this.username = username;
      this.accessKey = accessKey;
      this.endpoint = endpoint;
    }

    public Builder withBuild(String buildName) {
      this.buildName = buildName;
      return this;
    }

    public Builder withProject(String projectName) {
      this.projectName = projectName;
      return this;
    }

    public Builder withBranch(String branchName) {
      this.branchName = branchName;
      return this;
    }

    public Builder withDefaultBranch(String defaultBranchName) {
      this.defaultBranchName = defaultBranchName;
      return this;
    }

    public Builder withCaptureDom(Boolean captureDom) {
      this.captureDom = captureDom;
      return this;
    }

    public Builder withFullPageScreenshot(FullPageScreenshotConfig fullPageScreenshotConfig) {
      this.fullPageScreenshotConfig = fullPageScreenshotConfig;
      return this;
    }

    public VisualApi build() {
      VisualApi api =
          new VisualApi(
              driver,
              endpoint,
              username,
              accessKey,
              new BuildAttributes(buildName, projectName, branchName, defaultBranchName));

      if (this.captureDom != null) {
        api.setCaptureDom(this.captureDom);
      }
      if (this.fullPageScreenshotConfig != null) {
        api.enableFullPageScreenshots(this.fullPageScreenshotConfig);
      }
      return api;
    }
  }

  private final GraphQLClient client;

  private final VisualBuild build;
  private final String jobId;
  private final RemoteWebDriver driver;
  private final List<String> uploadedDiffIds = new ArrayList<>();
  private Boolean captureDom;
  private FullPageScreenshotConfig fullPageScreenshotConfig;
  private String sessionMetadataBlob;

  /**
   * Creates a VisualApi instance for a given Visual Backend {@link DataCenter}
   *
   * @param driver The {@link org.openqa.selenium.WebDriver} instance where the tests should run at
   * @param username SauceLabs username
   * @param accessKey SauceLabs access key
   */
  public VisualApi(RemoteWebDriver driver, String username, String accessKey) {
    this(driver, resolveEndpoint(), username, accessKey);
  }

  /**
   * Creates a VisualApi instance for a given Visual Backend {@link DataCenter}
   *
   * @param driver The {@link org.openqa.selenium.WebDriver} instance where the tests should run at
   * @param region Visual Backend Region. For available values, see: {@link DataCenter}
   * @param username SauceLabs username
   * @param accessKey SauceLabs access key
   */
  public VisualApi(RemoteWebDriver driver, DataCenter region, String username, String accessKey) {
    this(driver, region.endpoint, username, accessKey);
  }

  /**
   * Creates a VisualApi instance with a custom backend URL
   *
   * @param driver The {@link org.openqa.selenium.WebDriver} instance where the tests should run at
   * @param url Visual Backend URL
   * @param username SauceLabs username
   * @param accessKey SauceLabs access key
   */
  public VisualApi(RemoteWebDriver driver, String url, String username, String accessKey) {
    this(driver, url, username, accessKey, new BuildAttributes(null, null, null, null));
  }

  /**
   * Creates a VisualApi instance with a custom backend URL
   *
   * @param driver The {@link org.openqa.selenium.WebDriver} instance where the tests should run
   *     with
   * @param url Visual Backend URL
   * @param username SauceLabs username
   * @param accessKey SauceLabs access key
   * @param buildAttributes like buildName, project, branch
   */
  public VisualApi(
      RemoteWebDriver driver,
      String url,
      String username,
      String accessKey,
      BuildAttributes buildAttributes) {
    if (username == null
        || accessKey == null
        || username.trim().isEmpty()
        || accessKey.trim().isEmpty()) {
      throw new VisualApiException(
          "Invalid SauceLabs credentials. "
              + "Please check your SauceLabs username and access key at https://app.saucelabs.com/user-settings");
    }
    this.client = new GraphQLClient(url, username, accessKey);
    this.driver = driver;
    String sessionId = driver.getSessionId().toString();
    String jobIdString = (String) driver.getCapabilities().getCapability("jobUuid");
    this.jobId = jobIdString == null ? sessionId : jobIdString;
    this.build = VisualBuild.getBuildOnce(this, buildAttributes);
    this.sessionMetadataBlob = this.webdriverSessionInfo().blob;
  }

  VisualApi(
      String jobId,
      RemoteWebDriver driver,
      VisualBuild build,
      String sessionMetadataBlob,
      String url,
      String username,
      String accessKey) {
    if (username == null
        || accessKey == null
        || username.trim().isEmpty()
        || accessKey.trim().isEmpty()) {
      throw new VisualApiException(
          "Invalid SauceLabs credentials. "
              + "Please check your SauceLabs username and access key at https://app.saucelabs.com/user-settings");
    }
    this.build = build;
    this.jobId = jobId;
    this.driver = driver;
    this.client = new GraphQLClient(url, username, accessKey);
    this.sessionMetadataBlob = sessionMetadataBlob;
  }

  /**
   * Enables DOM Capture
   *
   * @param captureDom activation of DOM Capture.
   */
  public void setCaptureDom(Boolean captureDom) {
    this.captureDom = captureDom;
  }

  /** Enables full page screenshots */
  public void enableFullPageScreenshots() {
    this.fullPageScreenshotConfig = new FullPageScreenshotConfig.Builder().build();
  }

  /**
   * Enables full page screenshots
   *
   * @param fullPageScreenshotConfig config for full page screenshots
   */
  public void enableFullPageScreenshots(FullPageScreenshotConfig fullPageScreenshotConfig) {
    this.fullPageScreenshotConfig = fullPageScreenshotConfig;
  }

  private WebdriverSessionInfoQuery.Result webdriverSessionInfo() {
    WebdriverSessionInfoQuery query =
        new WebdriverSessionInfoQuery(
            new WebdriverSessionInfoQuery.WebdriverSessionInfoIn(
                this.jobId, this.driver.getSessionId().toString()));
    try {
      WebdriverSessionInfoQuery.Data response =
          this.client.execute(query, WebdriverSessionInfoQuery.Data.class);
      return response.result;
    } catch (VisualApiException e) {
      log.error(
          "Sauce Visual: No WebDriver session found. Please make sure WebDriver and Sauce Visual data centers are aligned.");
      throw e;
    }
  }

  /**
   * Generates a string to give the build link.
   *
   * @param url The url to the VisualBuild
   */
  private static String getStartupMessage(String url) {
    StringBuilder sb = new StringBuilder();
    sb.append("\n")
        .append("\n")
        .append(ConsoleColors.Bold(ConsoleColors.Yellow("Sauce Visual\n")))
        .append("\n")
        .append(String.format("%100s\n", url))
        .append("\n");
    return sb.toString();
  }

  public static class BuildAttributes {
    private final String name;
    private final String project;
    private final String branch;
    private final String defaultBranch;

    public BuildAttributes(String name, String project, String branch, String defaultBranch) {
      this.name = name;
      this.project = project;
      this.branch = branch;
      this.defaultBranch = defaultBranch;
    }

    public String getName() {
      if (isNotBlank(EnvironmentVariables.BUILD_NAME_DEPRECATED)) {
        log.warn(
            "Sauce Labs Visual: Environment variable \"BUILD_NAME\" is deprecated and will be removed in a future version. Please use \"SAUCE_VISUAL_BUILD_NAME\" instead.");
      }
      return valueOrDefault(
          valueOrDefault(name, EnvironmentVariables.BUILD_NAME),
          EnvironmentVariables.BUILD_NAME_DEPRECATED);
    }

    public String getProject() {
      return valueOrDefault(project, EnvironmentVariables.PROJECT_NAME);
    }

    public String getBranch() {
      return valueOrDefault(branch, EnvironmentVariables.BRANCH_NAME);
    }

    public String getDefaultBranch() {
      return valueOrDefault(defaultBranch, EnvironmentVariables.DEFAULT_BRANCH_NAME);
    }
  }

  VisualBuild createBuild(String buildName) {
    return createBuild(new BuildAttributes(buildName, null, null, null));
  }

  VisualBuild createBuild(BuildAttributes buildAttributes) {
    CreateBuildMutation mutation =
        new CreateBuildMutation(
            new CreateBuildMutation.BuildIn(
                buildAttributes.getName(),
                buildAttributes.getProject(),
                buildAttributes.getBranch(),
                buildAttributes.getDefaultBranch()));
    CreateBuildMutation.Data data = client.execute(mutation, CreateBuildMutation.Data.class);
    log.info(getStartupMessage(data.result.url));
    return new VisualBuild(
        data.result.id,
        data.result.name,
        data.result.project,
        data.result.branch,
        data.result.defaultBranch,
        data.result.url);
  }

  /**
   * Executes a finishBuild mutation
   *
   * @param buildId Build id
   * @return Finished build
   */
  FinishBuildMutation.Result finishBuild(String buildId) {
    FinishBuildMutation mutation =
        new FinishBuildMutation(new FinishBuildMutation.FinishBuildIn(buildId));
    return client.execute(mutation, FinishBuildMutation.Data.class).result;
  }

  /**
   * Uploads and creates a snapshot with a given name and default options
   *
   * @deprecated Use sauceVisualCheck(). check() will be removed in a future version.
   * @param name A name for the snapshot
   */
  public void check(String name) {
    log.warn(
        "Sauce Labs Visual: Method \"check()\" is deprecated and will be removed in a future version. Please use \"sauceVisualCheck()\".");
    sauceVisualCheck(name);
  }

  /**
   * Uploads and creates a snapshot with a given name and default options
   *
   * @deprecated Use sauceVisualCheck(). check() will be removed in a future version.
   * @param name A name for the snapshot
   * @param options Options for the API
   */
  public void check(String name, CheckOptions options) {
    log.warn(
        "Sauce Labs Visual: Method \"check()\" is deprecated and will be removed in a future version. Please use \"sauceVisualCheck()\".");
    sauceVisualCheck(name, options);
  }

  /**
   * Uploads and creates a snapshot with a given name and default options
   *
   * @param snapshotName A name for the snapshot
   */
  public void sauceVisualCheck(String snapshotName) {
    sauceVisualCheck(snapshotName, new CheckOptions());
  }

  /**
   * Uploads and creates a snapshot with a given snapshotName and options
   *
   * @param snapshotName A name for the snapshot
   * @param options Options for the API
   */
  public void sauceVisualCheck(String snapshotName, CheckOptions options) {
    DiffingMethod diffingMethod = toDiffingMethod(options);

    CreateSnapshotFromWebDriverMutation.CreateSnapshotFromWebDriverIn input =
        new CreateSnapshotFromWebDriverMutation.CreateSnapshotFromWebDriverIn(
            this.build.getId(),
            diffingMethod,
            Optional.ofNullable(options.getDiffingOptions()),
            extractIgnoreList(options),
            extractIgnoreElements(options),
            this.jobId,
            snapshotName,
            this.driver.getSessionId().toString(),
            this.sessionMetadataBlob);

    if (options.getTestName() != null) {
      input.setTestName(options.getTestName());
    } else if (TestMetaInfo.THREAD_LOCAL.get().isPresent()) {
      input.setTestName(TestMetaInfo.THREAD_LOCAL.get().get().getTestName());
    }

    if (options.getSuiteName() != null) {
      input.setSuiteName(options.getSuiteName());
    } else if (TestMetaInfo.THREAD_LOCAL.get().isPresent()) {
      input.setSuiteName(TestMetaInfo.THREAD_LOCAL.get().get().getTestSuite());
    }

    Boolean captureDom = Optional.ofNullable(options.getCaptureDom()).orElse(this.captureDom);
    if (captureDom != null) {
      input.setCaptureDom(captureDom);
    }

    if (options.getClipElement() != null) {
      input.setClipElement(options.getClipElement());
    } else if (options.getClipSelector() != null) {
      input.setClipElement(this.driver.findElement(By.cssSelector(options.getClipSelector())));
    }

    FullPageScreenshotConfig fullPageScreenshotConfig =
        Optional.ofNullable(options.getFullPageScreenshotConfig())
            .orElse(this.fullPageScreenshotConfig);
    if (fullPageScreenshotConfig != null) {
      input.setFullPageConfig(fullPageScreenshotConfig);
    }

    CreateSnapshotFromWebDriverMutation mutation = new CreateSnapshotFromWebDriverMutation(input);
    CreateSnapshotFromWebDriverMutation.Data check =
        this.client.execute(mutation, CreateSnapshotFromWebDriverMutation.Data.class);
    if (check != null && check.result != null) {
      uploadedDiffIds.addAll(
          check.result.diffs.getNodes().stream().map(Diff::getId).collect(Collectors.toList()));
    }
  }

  private static DiffingMethod toDiffingMethod(CheckOptions options) {
    if (options == null || options.getDiffingMethod() == null) {
      return null;
    }

    switch (options.getDiffingMethod()) {
      case BALANCED:
        return DiffingMethod.BALANCED;
      case EXPERIMENTAL:
        return DiffingMethod.EXPERIMENTAL;
      default:
        return DiffingMethod.SIMPLE;
    }
  }

  /**
   * Return the current processing status of uploaded snapshots.
   *
   * @deprecated Use sauceVisualResults(). checkResults() will be removed in a future version.
   * @return A map of DiffStatus and its count of snapshot in that status.
   */
  public Map<DiffStatus, Integer> checkResults() {
    return this.sauceVisualResults();
  }

  /**
   * Return the current processing status of uploaded snapshots.
   *
   * @return A map of DiffStatus and its count of snapshot in that status.
   */
  public Map<DiffStatus, Integer> sauceVisualResults() {
    RetryPolicy<Object> retryPolicy =
        RetryPolicy.builder()
            .handle(VisualApiException.class)
            .withBackoff(Duration.ofMillis(100), Duration.ofSeconds(120))
            .withMaxRetries(10)
            .build();
    return Failsafe.with(retryPolicy).get(this::getDiffStatusSummary);
  }

  private Map<DiffStatus, Integer> getDiffStatusSummary() {
    Map<DiffStatus, Integer> initialStatusSummary = new HashMap<>();
    initialStatusSummary.put(DiffStatus.APPROVED, 0);
    initialStatusSummary.put(DiffStatus.EQUAL, 0);
    initialStatusSummary.put(DiffStatus.UNAPPROVED, 0);
    initialStatusSummary.put(DiffStatus.REJECTED, 0);
    initialStatusSummary.put(DiffStatus.QUEUED, 0);

    DiffsForTestResultQuery query = new DiffsForTestResultQuery(this.build.getId());
    DiffsForTestResultQuery.Data diffsForTestResult =
        this.client.execute(query, DiffsForTestResultQuery.Data.class);
    if (diffsForTestResult == null || diffsForTestResult.result == null) {
      return initialStatusSummary;
    }

    Map<DiffStatus, Integer> statusSummary = new HashMap<>(initialStatusSummary);
    for (DiffsForTestResultQuery.Node diff : diffsForTestResult.result.nodes) {
      if (uploadedDiffIds.contains(diff.id)) {
        statusSummary.put(diff.status, statusSummary.getOrDefault(diff.status, 0) + 1);
      }
    }

    if (statusSummary.get(DiffStatus.QUEUED) > 0) {
      throw new VisualApiException("Some diffs are not ready");
    }

    uploadedDiffIds.clear();

    return statusSummary;
  }

  public void refreshWebDriverSessionInfo() {
    this.sessionMetadataBlob = this.webdriverSessionInfo().blob;
  }

  private List<RegionIn> extractIgnoreList(CheckOptions options) {
    if (options == null) {
      return Collections.emptyList();
    }

    List<IgnoreRegion> ignoredRegions =
        options.getIgnoreRegions() == null ? Arrays.asList() : options.getIgnoreRegions();

    List<VisualRegion> visualRegions =
        options.getIgnoreRegions() == null ? Arrays.asList() : options.getRegions();

    List<RegionIn> result = new ArrayList<>();
    for (int i = 0; i < ignoredRegions.size(); i++) {
      IgnoreRegion ignoreRegion = ignoredRegions.get(i);
      if (validate(ignoreRegion) == null) {
        throw new VisualApiException("options.ignoreRegion[" + i + "] is an invalid ignore region");
      }
      result.add(
          VisualRegion.ignoreChangesFor(
                  ignoreRegion.getName(),
                  ignoreRegion.getX(),
                  ignoreRegion.getHeight(),
                  ignoreRegion.getWidth(),
                  ignoreRegion.getHeight())
              .toRegionIn());
    }
    for (int i = 0; i < visualRegions.size(); i++) {
      VisualRegion region = visualRegions.get(i);
      if (validate(region) == null) {
        throw new VisualApiException("options.region[" + i + "] is an invalid visual region");
      }
      result.add(region.toRegionIn());
    }
    return result;
  }

  private List<ElementIn> extractIgnoreElements(CheckOptions options) {
    List<WebElement> ignoredElements =
        options != null && options.getIgnoreElements() != null
            ? options.getIgnoreElements()
            : Arrays.asList();

    List<ElementIn> result = new ArrayList<>();
    for (int i = 0; i < ignoredElements.size(); i++) {
      WebElement element = ignoredElements.get(i);
      if (validate(element) == null) {
        throw new VisualApiException("options.ignoreElement[" + i + "] does not exist (yet)");
      }
      result.add(VisualRegion.ignoreChangesFor(element).toElementIn());
    }
    return result;
  }

  private WebElement validate(WebElement element) {
    if (element instanceof RemoteWebElement && element.isDisplayed()) {
      return element;
    }
    return null;
  }

  private IgnoreRegion validate(IgnoreRegion region) {
    if (region == null) {
      return null;
    }
    if (region.getHeight() <= 0 || region.getWidth() <= 0) {
      return null;
    }
    return region;
  }

  private VisualRegion validate(VisualRegion region) {
    if (region == null) {
      return null;
    }
    if (0 < region.getHeight() * region.getWidth()) {
      return region;
    }
    WebElement ele = region.getElement();
    if (ele != null && ele.isDisplayed() && ele.getRect() != null) {
      return region;
    }
    return null;
  }

  public VisualBuild getBuild() {
    return build;
  }

  BuildQuery.Result getBuildById(String id) {
    BuildQuery.Data data = client.execute(new BuildQuery(id), BuildQuery.Data.class);
    if (data == null) {
      return null;
    }
    return data.result;
  }

  BuildByCustomIdQuery.Result getBuildByCustomId(String customId) {
    BuildByCustomIdQuery.Data data =
        client.execute(new BuildByCustomIdQuery(customId), BuildByCustomIdQuery.Data.class);
    if (data == null) {
      return null;
    }
    return data.result;
  }
}
