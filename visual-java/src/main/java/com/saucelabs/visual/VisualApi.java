package com.saucelabs.visual;

import static com.saucelabs.visual.utils.EnvironmentVariables.isNotBlank;
import static com.saucelabs.visual.utils.EnvironmentVariables.valueOrDefault;

import com.saucelabs.visual.exception.InvalidIgnoreSelectorException;
import com.saucelabs.visual.exception.InvalidVisualRegionException;
import com.saucelabs.visual.exception.InvalidWebElementException;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.*;
import com.saucelabs.visual.graphql.type.*;
import com.saucelabs.visual.model.*;
import com.saucelabs.visual.model.DiffingMethodSensitivity;
import com.saucelabs.visual.utils.*;
import dev.failsafe.Failsafe;
import dev.failsafe.RetryPolicy;
import java.awt.image.BufferedImage;
import java.lang.reflect.Field;
import java.net.URL;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.apache.http.client.config.RequestConfig;
import org.openqa.selenium.*;
import org.openqa.selenium.remote.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class VisualApi {
  private static final Logger log = LoggerFactory.getLogger(VisualApi.class);
  private static final Pattern sauceRegionRegex = Pattern.compile("saucelabs.(com|net)");

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
    private Boolean hideScrollBars;
    private DiffingMethodSensitivity diffingMethodSensitivity;
    private DiffingMethodTolerance diffingMethodTolerance;
    private RequestConfig requestConfig;
    private Boolean isSauceSession;

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

    public Builder withHideScrollBars(Boolean hideScrollBars) {
      this.hideScrollBars = hideScrollBars;
      return this;
    }

    public Builder withDiffingMethodSensitivity(DiffingMethodSensitivity diffingMethodSensitivity) {
      this.diffingMethodSensitivity = diffingMethodSensitivity;
      return this;
    }

    public Builder withDiffingMethodTolerance(DiffingMethodTolerance diffingMethodTolerance) {
      this.diffingMethodTolerance = diffingMethodTolerance;
      return this;
    }

    public Builder withRequestConfig(RequestConfig requestConfig) {
      this.requestConfig = requestConfig;
      return this;
    }

    /**
     * Set whether this is running against a Sauce session. If not called, we'll do our best to
     * automatically determine this setting. Set false to run against a local grid / local Selenium
     * session.
     */
    public Builder withSauceSession(Boolean isSauceSession) {
      this.isSauceSession = isSauceSession;
      return this;
    }

    private BuildAttributes getBuildAttributes() {
      return new BuildAttributes(buildName, projectName, branchName, defaultBranchName);
    }

    public VisualApi build() {
      VisualApi api = new VisualApi(this);

      if (this.captureDom != null) {
        api.setCaptureDom(this.captureDom);
      }
      if (this.fullPageScreenshotConfig != null) {
        api.enableFullPageScreenshots(this.fullPageScreenshotConfig);
      }
      if (this.hideScrollBars != null) {
        api.setHideScrollBars(this.hideScrollBars);
      }
      if (this.diffingMethodSensitivity != null) {
        api.setDiffingMethodSensitivity(this.diffingMethodSensitivity);
      }
      if (this.diffingMethodTolerance != null) {
        api.setDiffingMethodTolerance(this.diffingMethodTolerance);
      }
      return api;
    }
  }

  private final GraphQLClient client;
  private final BulkDriverHelper bulkDriverHelper;

  private final VisualBuild build;
  private final String jobId;
  private final String sessionId;
  private final List<String> uploadedDiffIds = new ArrayList<>();
  private Boolean captureDom;
  private FullPageScreenshotConfig fullPageScreenshotConfig;
  private Boolean hideScrollBars;
  private DiffingMethodSensitivity diffingMethodSensitivity;
  private DiffingMethodTolerance diffingMethodTolerance;
  private String sessionMetadataBlob;
  private final RemoteWebDriver driver;
  private Boolean isSauceSession;

  /**
   * Creates a VisualApi instance for a given Visual Backend {@link DataCenter}
   *
   * @param driver The {@link WebDriver} instance where the tests should run at
   * @param username SauceLabs username
   * @param accessKey SauceLabs access key
   */
  public VisualApi(RemoteWebDriver driver, String username, String accessKey) {
    this(driver, resolveEndpoint(), username, accessKey);
  }

  /**
   * Creates a VisualApi instance for a given Visual Backend {@link DataCenter}
   *
   * @param driver The {@link WebDriver} instance where the tests should run at
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
   * @param driver The {@link WebDriver} instance where the tests should run at
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
   * @param driver The {@link WebDriver} instance where the tests should run with
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
    this(driver, url, username, accessKey, buildAttributes, null);
  }

  /**
   * Creates a VisualApi instance with a custom backend URL
   *
   * @param driver The {@link WebDriver} instance where the tests should run with
   * @param url Visual Backend URL
   * @param username SauceLabs username
   * @param accessKey SauceLabs access key
   * @param buildAttributes like buildName, project, branch
   * @param requestConfig RequestConfig object to override proxy / request settings for the client.
   */
  public VisualApi(
      RemoteWebDriver driver,
      String url,
      String username,
      String accessKey,
      BuildAttributes buildAttributes,
      RequestConfig requestConfig) {
    this(driver, url, username, accessKey, buildAttributes, requestConfig, false);
  }

  private VisualApi(
      RemoteWebDriver driver,
      String url,
      String username,
      String accessKey,
      BuildAttributes buildAttributes,
      RequestConfig requestConfig,
      Boolean isSauceSession) {
    if (username == null
        || accessKey == null
        || username.trim().isEmpty()
        || accessKey.trim().isEmpty()) {
      throw new VisualApiException(
          "Invalid SauceLabs credentials. "
              + "Please check your SauceLabs username and access key at https://app.saucelabs.com/user-settings");
    }
    this.client = new GraphQLClient(url, username, accessKey, requestConfig);
    this.sessionId = driver.getSessionId().toString();
    String jobIdString = (String) driver.getCapabilities().getCapability("jobUuid");
    this.jobId = jobIdString == null ? sessionId : jobIdString;
    this.build = VisualBuild.getBuildOnce(this, buildAttributes);
    this.driver = driver;
    this.isSauceSession = isSauceSession;
    this.bulkDriverHelper = new BulkDriverHelper(driver);
    refreshWebDriverSessionInfo();
  }

  private VisualApi(Builder builder) {
    this(
        builder.driver,
        builder.endpoint,
        builder.username,
        builder.accessKey,
        builder.getBuildAttributes(),
        builder.requestConfig,
        builder.isSauceSession);
  }

  VisualApi(
      String jobId,
      RemoteWebDriver driver,
      VisualBuild build,
      String sessionMetadataBlob,
      String url,
      String username,
      String accessKey) {
    this(jobId, driver, build, sessionMetadataBlob, url, username, accessKey, null);
  }

  VisualApi(
      String jobId,
      RemoteWebDriver driver,
      VisualBuild build,
      String sessionMetadataBlob,
      String url,
      String username,
      String accessKey,
      RequestConfig requestConfig) {
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
    this.sessionId = driver.getSessionId().toString();
    this.driver = driver;
    this.client = new GraphQLClient(url, username, accessKey, requestConfig);
    this.sessionMetadataBlob = sessionMetadataBlob;
    this.bulkDriverHelper = new BulkDriverHelper(driver);
  }

  /**
   * Use reflection to attempt to automatically determine if the current session is Sauce if not
   * already configured by the user or cached.
   */
  private boolean isSauceSession() {
    if (isSauceSession != null) {
      return isSauceSession;
    }

    CommandExecutor executor = this.driver.getCommandExecutor();
    Object resolvedExecutor = null;
    if (executor instanceof TracedCommandExecutor) {
      try {
        final Field field = TracedCommandExecutor.class.getDeclaredField("delegate");
        field.setAccessible(true);
        resolvedExecutor = field.get(executor);
      } catch (NoSuchFieldException | IllegalAccessException ignored) {
      }
    } else if (executor instanceof HttpCommandExecutor) {
      resolvedExecutor = executor;
    }

    if (resolvedExecutor instanceof HttpCommandExecutor) {
      URL remoteUrl = ((HttpCommandExecutor) resolvedExecutor).getAddressOfRemoteServer();
      Matcher matcher = sauceRegionRegex.matcher(remoteUrl.toString());
      isSauceSession = matcher.find();
    } else {
      // Fallback to assuming this is currently a sauce session. This can be overridden via the
      // builder options.
      isSauceSession = true;
    }

    return isSauceSession;
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

  /**
   * Hide all scrollbars in the web app. Default value is `true`.
   *
   * @param hideScrollBars set scroll bars visibility.
   */
  public void setHideScrollBars(Boolean hideScrollBars) {
    this.hideScrollBars = hideScrollBars;
  }

  public void setDiffingMethodSensitivity(DiffingMethodSensitivity diffingMethodSensitivity) {
    this.diffingMethodSensitivity = diffingMethodSensitivity;
  }

  public void setDiffingMethodTolerance(DiffingMethodTolerance diffingMethodTolerance) {
    this.diffingMethodTolerance = diffingMethodTolerance;
  }

  private String webdriverSessionInfo() {
    WebdriverSessionInfoQuery query =
        new WebdriverSessionInfoQuery(
            new WebdriverSessionInfoQuery.WebdriverSessionInfoIn(this.jobId, this.sessionId));
    try {
      WebdriverSessionInfoQuery.Data response =
          this.client.execute(query, WebdriverSessionInfoQuery.Data.class);
      return response.result.blob;
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
  public String sauceVisualCheck(String snapshotName) {
    return sauceVisualCheck(snapshotName, new CheckOptions());
  }

  /**
   * Uploads and creates a snapshot with a given snapshotName and options
   *
   * @param snapshotName A name for the snapshot
   * @param options Options for the API
   */
  public String sauceVisualCheck(String snapshotName, CheckOptions options) {
    if (isSauceSession()) {
      return sauceVisualCheckSauce(snapshotName, options);
    } else {
      return sauceVisualCheckLocal(snapshotName, options);
    }
  }

  private String sauceVisualCheckSauce(String snapshotName, CheckOptions options) {
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
            this.sessionId,
            this.sessionMetadataBlob,
            options.getIgnoreSelectors());

    input.setTestName(getOrInferTestName(options));
    input.setSuiteName(getOrInferSuiteName(options));

    Boolean captureDom = Optional.ofNullable(options.getCaptureDom()).orElse(this.captureDom);
    if (captureDom != null) {
      input.setCaptureDom(captureDom);
    }

    WebElement clipElement = getClipElement(options);
    if (clipElement != null) {
      input.setClipElement(clipElement);
    }

    FullPageScreenshotConfig fullPageScreenshotConfig =
        Optional.ofNullable(options.getFullPageScreenshotConfig())
            .orElse(this.fullPageScreenshotConfig);
    if (fullPageScreenshotConfig != null) {
      input.setFullPageConfig(fullPageScreenshotConfig);
    }

    Boolean hideScrollBars =
        Optional.ofNullable(options.getHideScrollBars()).orElse(this.hideScrollBars);
    if (hideScrollBars != null) {
      input.setHideScrollBars(hideScrollBars);
    }

    DiffingMethodSensitivity diffingMethodSensitivity = getDiffingMethodSensitivity(options);
    if (diffingMethodSensitivity != null) {
      input.setDiffingMethodSensitivity(diffingMethodSensitivity);
    }

    DiffingMethodTolerance diffingMethodTolerance = getDiffingMethodTolerance(options);
    if (diffingMethodTolerance != null) {
      input.setDiffingMethodTolerance(diffingMethodTolerance);
    }

    CreateSnapshotFromWebDriverMutation mutation = new CreateSnapshotFromWebDriverMutation(input);
    CreateSnapshotFromWebDriverMutation.Data check =
        this.client.execute(mutation, CreateSnapshotFromWebDriverMutation.Data.class);
    if (check != null && check.result != null) {
      uploadedDiffIds.addAll(
          check.result.diffs.getNodes().stream().map(Diff::getId).collect(Collectors.toList()));

      return check.result.id;
    }

    return null;
  }

  /**
   * Expose execute binding directly, allowing queries to the Visual API using the existing client.
   */
  public <D> D execute(GraphQLOperation operation, Class<D> responseType) {
    return this.client.execute(operation, responseType);
  }

  private String sauceVisualCheckLocal(String snapshotName, CheckOptions options) {
    Window window = new Window(this.driver);
    Rectangle viewport = window.getViewport();

    byte[] screenshot;

    // clip image if required
    WebElement clipElement = getClipElement(options);
    if (clipElement != null) {
      Rectangle clipRect = clipElement.getRect();

      // Scroll to the clipped element
      Rectangle newViewport = window.scrollTo(clipRect.getPoint());
      screenshot = driver.getScreenshotAs(OutputType.BYTES);

      // Restore the original scroll
      window.scrollTo(viewport.getPoint());

      Optional<Rectangle> cropRect = CartesianHelpers.intersect(clipRect, newViewport);
      if (!cropRect.isPresent()) {
        throw new VisualApiException("Clipping would result in an empty image");
      }

      BufferedImage image = ImageHelpers.loadImage(screenshot);
      BufferedImage cropped =
          ImageHelpers.cropImage(
              image, CartesianHelpers.relativeTo(newViewport.getPoint(), cropRect.get()));
      screenshot = ImageHelpers.saveImage(cropped, "png");
      viewport = cropRect.get();
    } else {
      screenshot = driver.getScreenshotAs(OutputType.BYTES);
    }

    // create upload and get urls
    CreateSnapshotUploadMutation mutation =
        new CreateSnapshotUploadMutation(
            SnapshotUploadIn.builder().withBuildId(this.build.getId()).build());
    SnapshotUpload uploadResult =
        this.client.execute(mutation, CreateSnapshotUploadMutation.Data.class).result;

    // add ignore regions
    List<RegionIn> ignoreRegions = extractIgnoreList(options);
    ignoreRegions.addAll(
        extractElementsToIgnoreRegions(
            Optional.ofNullable(options.getIgnoreElements()).orElse(Collections.emptyList())));
    ignoreRegions.addAll(extractIgnoreSelectors(options));

    // make regions relative to viewport
    List<RegionIn> visibleIgnoreRegions = new ArrayList<>();
    for (RegionIn region : ignoreRegions) {
      Rectangle regionRect =
          new Rectangle(region.getX(), region.getY(), region.getHeight(), region.getWidth());

      if (CartesianHelpers.intersect(regionRect, viewport).isPresent()) {
        Point newPoint =
            CartesianHelpers.relativeTo(
                viewport.getPoint(), new Point(region.getX(), region.getY()));
        region.setX(newPoint.x);
        region.setY(newPoint.y);

        visibleIgnoreRegions.add(region);
      }
    }

    // upload image
    this.client.upload(uploadResult.getImageUploadUrl(), screenshot, "image/png");

    // upload dom if present / enabled
    Boolean shouldCaptureDom = Optional.ofNullable(options.getCaptureDom()).orElse(this.captureDom);
    if (shouldCaptureDom != null && shouldCaptureDom) {
      Object result = this.driver.executeScript(this.client.getDomCaptureScript());
      if (result instanceof String) {
        this.client.upload(
            uploadResult.getDomUploadUrl(), ((String) result).getBytes(), "text/html");
      } else {
        System.out.println("Failed to capture Visual DOM.");
      }
    }

    Capabilities caps = driver.getCapabilities();

    Map<String, Object> dims =
        (Map<String, Object>)
            driver.executeScript(
                "return { height: window.innerHeight, width: window.innerWidth, dpr: window.devicePixelRatio }");
    String deviceName = String.format("Desktop (%sx%s)", dims.get("width"), dims.get("height"));

    // create snapshot using upload id
    CreateSnapshotMutation snapshotMutation =
        new CreateSnapshotMutation(
            SnapshotIn.builder()
                .withBrowser(CapabilityUtils.getBrowser(caps))
                .withBrowserVersion(caps.getBrowserVersion())
                .withDevice(deviceName)
                .withDevicePixelRatio(formatDevicePixelRatio(dims.get("dpr")))
                .withOperatingSystem(CapabilityUtils.getOperatingSystem(caps))
                .withUploadId(uploadResult.getId())
                .withBuildId(this.build.getId())
                .withTestName(getOrInferTestName(options))
                .withSuiteName(getOrInferSuiteName(options))
                .withDiffingMethod(toDiffingMethod(options))
                .withDiffingOptions(options.getDiffingOptions())
                .withIgnoreRegions(visibleIgnoreRegions)
                .withDiffingMethodSensitivity(
                    Optional.ofNullable(getDiffingMethodSensitivity(options))
                        .map(DiffingMethodSensitivity::asGraphQLType)
                        .orElse(null))
                .withDiffingMethodTolerance(
                    Optional.ofNullable(getDiffingMethodTolerance(options))
                        .map(DiffingMethodTolerance::asGraphQLType)
                        .orElse(null))
                .withName(snapshotName)
                .build());
    CreateSnapshotMutation.Data result =
        this.client.execute(snapshotMutation, CreateSnapshotMutation.Data.class);
    return result.result.getId();
  }

  /** Parse the Selenium parsed value from window.devicePixelRatio into a Double for our API */
  private double formatDevicePixelRatio(Object rawDpr) {
    double dpr = 1.0;

    if (rawDpr instanceof Long) {
      dpr = ((Long) rawDpr).doubleValue();
    } else if (rawDpr instanceof Double) {
      dpr = (Double) rawDpr;
    }

    return dpr;
  }

  private String getOrInferSuiteName(CheckOptions options) {
    if (options.getSuiteName() != null) {
      return options.getSuiteName();
    } else if (TestMetaInfo.THREAD_LOCAL.get().isPresent()) {
      return TestMetaInfo.THREAD_LOCAL.get().get().getTestSuite();
    }

    return null;
  }

  private String getOrInferTestName(CheckOptions options) {
    if (options.getTestName() != null) {
      return options.getTestName();
    } else if (TestMetaInfo.THREAD_LOCAL.get().isPresent()) {
      return TestMetaInfo.THREAD_LOCAL.get().get().getTestName();
    }

    return null;
  }

  private DiffingMethodSensitivity getDiffingMethodSensitivity(CheckOptions checkOptions) {
    DiffingMethodSensitivity sensitivity = checkOptions.getDiffingMethodSensitivity();
    return sensitivity != null ? sensitivity : this.diffingMethodSensitivity;
  }

  private DiffingMethodTolerance getDiffingMethodTolerance(CheckOptions checkOptions) {
    DiffingMethodTolerance sensitivity = checkOptions.getDiffingMethodTolerance();
    return sensitivity != null ? sensitivity : this.diffingMethodTolerance;
  }

  private WebElement getClipElement(CheckOptions checkOptions) {
    if (checkOptions.getClipElement() != null) {
      return checkOptions.getClipElement();
    } else if (checkOptions.getClipSelector() != null) {
      return this.driver.findElement(By.cssSelector(checkOptions.getClipSelector()));
    }

    return null;
  }

  private static DiffingMethod toDiffingMethod(CheckOptions options) {
    if (options == null || options.getDiffingMethod() == null) {
      return DiffingMethod.BALANCED;
    }

    switch (options.getDiffingMethod()) {
      case SIMPLE:
        return DiffingMethod.SIMPLE;
      default:
        return DiffingMethod.BALANCED;
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
    if (isSauceSession()) {
      this.sessionMetadataBlob = this.webdriverSessionInfo();
    }
  }

  private List<RegionIn> extractIgnoreList(CheckOptions options) {
    if (options == null) {
      return Collections.emptyList();
    }

    List<IgnoreRegion> ignoredRegions =
        options.getIgnoreRegions() == null ? Collections.emptyList() : options.getIgnoreRegions();

    List<VisualRegion> visualRegions =
        options.getRegions() == null ? Collections.emptyList() : options.getRegions();

    List<VisualRegion> allVisualRegions =
        new ArrayList<>(ignoredRegions.size() + visualRegions.size());
    allVisualRegions.addAll(visualRegions);

    for (IgnoreRegion ignoreRegion : ignoredRegions) {
      allVisualRegions.add(new VisualRegion(ignoreRegion));
    }

    return extractRegions(allVisualRegions);
  }

  private List<RegionIn> extractRegions(List<VisualRegion> regions) {
    List<RegionIn> result = new ArrayList<>(regions.size());
    List<WebElement> bulkWebElements = new ArrayList<>();
    List<VisualRegion> bulkRegions = new ArrayList<>();

    for (VisualRegion region : regions) {
      if (validate(region) == null) {
        throw new InvalidVisualRegionException(region, "Visual region is invalid");
      }

      WebElement element = region.getElement();
      if (element != null) {
        bulkWebElements.add(element);
        bulkRegions.add(region);
      } else {
        result.add(region.toRegionIn());
      }
    }

    List<Boolean> bulkIsDisplayed = bulkDriverHelper.areDisplayed(bulkWebElements);
    for (int i = 0; i < bulkIsDisplayed.size(); i++) {
      VisualRegion region = bulkRegions.get(i);
      Boolean isDisplayed = bulkIsDisplayed.get(i);
      if (!isDisplayed) {
        throw new InvalidVisualRegionException(
            region, "Visual region's web element does not exist (yet)");
      }
    }

    List<Rectangle> bulkRectangles = bulkDriverHelper.getRects(bulkWebElements);
    for (int i = 0; i < bulkRectangles.size(); i++) {
      VisualRegion region = bulkRegions.get(i);
      Rectangle rectangle = bulkRectangles.get(i);
      result.add(VisualRegion.ignoreChangesFor(region.getName(), rectangle).toRegionIn());
    }

    return result;
  }

  private List<ElementIn> extractIgnoreElements(CheckOptions options) {
    List<WebElement> ignoredElements =
        options != null && options.getIgnoreElements() != null
            ? options.getIgnoreElements()
            : Arrays.asList();

    List<ElementIn> result = new ArrayList<>();

    List<Boolean> bulkIsDisplayed = bulkDriverHelper.areDisplayed(ignoredElements);
    for (int i = 0; i < bulkIsDisplayed.size(); i++) {
      WebElement element = ignoredElements.get(i);
      Boolean isDisplayed = bulkIsDisplayed.get(i);
      if (!isDisplayed) {
        throw new InvalidWebElementException(element, "Web element does not exist (yet)");
      }

      result.add(VisualRegion.ignoreChangesFor(element).toElementIn());
    }

    return result;
  }

  private List<RegionIn> extractElementsToIgnoreRegions(List<WebElement> elements) {
    List<RegionIn> result = new ArrayList<>();

    List<Boolean> bulkIsDisplayed = bulkDriverHelper.areDisplayed(elements);
    for (int i = 0; i < bulkIsDisplayed.size(); i++) {
      WebElement element = elements.get(i);
      Boolean isDisplayed = bulkIsDisplayed.get(i);
      if (!isDisplayed) {
        throw new InvalidWebElementException(element, "Web element does not exist (yet)");
      }
    }

    List<Rectangle> bulkRectangles = bulkDriverHelper.getRects(elements);
    for (Rectangle rectangle : bulkRectangles) {
      result.add(VisualRegion.ignoreChangesFor(rectangle).toRegionIn());
    }

    return result;
  }

  private List<RegionIn> extractIgnoreSelectors(CheckOptions options) {
    List<IgnoreSelectorIn> selectors =
        options != null && options.getIgnoreSelectors() != null
            ? options.getIgnoreSelectors()
            : Arrays.asList();

    List<List<WebElement>> elementLists =
        bulkDriverHelper.resolveElements(
            selectors.stream().map(IgnoreSelectorIn::getSelector).collect(Collectors.toList()));

    for (int i = 0; i < selectors.size(); i++) {
      List<WebElement> elements = elementLists.get(i);
      IgnoreSelectorIn selector = selectors.get(i);
      if (elements == null || elements.isEmpty()) {
        throw new InvalidIgnoreSelectorException(selector, "Web element does not exist");
      }
    }

    List<RegionIn> result = new ArrayList<>();

    List<RegionIn> flatRegions =
        extractElementsToIgnoreRegions(
            elementLists.stream().flatMap(List::stream).collect(Collectors.toList()));

    for (int listIndex = 0, regionIndex = 0; listIndex < elementLists.size(); listIndex++) {
      IgnoreSelectorIn selector = selectors.get(listIndex);
      List<WebElement> elements = elementLists.get(listIndex);
      List<RegionIn> regions = flatRegions.subList(regionIndex, regionIndex + elements.size());

      result.addAll(
          regions.stream()
              .map(
                  region ->
                      new VisualRegion(
                              new IgnoreRegion(
                                  region.getName(),
                                  region.getX(),
                                  region.getY(),
                                  region.getWidth(),
                                  region.getHeight()),
                              selector.getDiffingOptions())
                          .toRegionIn())
              .collect(Collectors.toList()));

      regionIndex += regions.size();
    }

    return result;
  }

  private VisualRegion validate(VisualRegion region) {
    if (region == null) {
      return null;
    }
    if (0 < region.getHeight() * region.getWidth()) {
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
