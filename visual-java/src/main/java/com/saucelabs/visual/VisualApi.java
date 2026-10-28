package com.saucelabs.visual;

import static com.saucelabs.visual.utils.EnvironmentVariables.isNotBlank;
import static com.saucelabs.visual.utils.EnvironmentVariables.valueOrDefault;

import com.saucelabs.visual.exception.InvalidIgnoreSelectorException;
import com.saucelabs.visual.exception.InvalidVisualRegionException;
import com.saucelabs.visual.exception.InvalidWebElementException;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.*;
import com.saucelabs.visual.graphql.type.*;
import com.saucelabs.visual.graphql.type.OperatingSystem;
import com.saucelabs.visual.model.*;
import com.saucelabs.visual.model.DiffingMethodSensitivity;
import com.saucelabs.visual.utils.*;
import dev.failsafe.Failsafe;
import dev.failsafe.RetryPolicy;
import java.lang.reflect.Field;
import java.net.URL;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.apache.http.client.config.RequestConfig;
import org.openqa.selenium.*;
import org.openqa.selenium.bidi.browsingcontext.BrowsingContext;
import org.openqa.selenium.bidi.browsingcontext.CaptureScreenshotParameters;
import org.openqa.selenium.remote.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class VisualApi {
  private static final Logger log = LoggerFactory.getLogger(VisualApi.class);
  private static final Pattern sauceRegionRegex = Pattern.compile("saucelabs.(com|net)");

  private static String resolveEndpoint() {
    return DataCenter.fromSauceRegion(EnvironmentVariableProvider.DEFAULT.getSauceRegion())
        .endpoint;
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
    private List<String> tags;
    private String buildId;
    private String customId;
    private Duration finishDelay;
    private Boolean captureDom;
    private FullPageScreenshotConfig fullPageScreenshotConfig;
    private Boolean hideScrollBars;
    private DiffingMethodSensitivity diffingMethodSensitivity;
    private DiffingMethodTolerance diffingMethodTolerance;
    private BaselineOverride baselineOverride;
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

    /**
     * Attach the created {@link VisualApi} to an existing build identified by its Sauce Visual
     * build id. When set, this takes precedence over the {@code SAUCE_VISUAL_BUILD_ID} environment
     * variable and over {@link #withCustomId(String)}.
     *
     * @param buildId Sauce Visual build id to reuse.
     */
    public Builder withBuildId(String buildId) {
      this.buildId = buildId;
      return this;
    }

    /**
     * Attach the created {@link VisualApi} to an existing build identified by its custom id. When
     * set, this takes precedence over the {@code SAUCE_VISUAL_CUSTOM_ID} environment variable.
     *
     * @param customId Custom id previously assigned to a build.
     */
    public Builder withCustomId(String customId) {
      this.customId = customId;
      return this;
    }

    /**
     * Delay the server-side build completion by {@code delay} and keep the build open for new
     * snapshots
     *
     * <p>Must be called with <strong>after</strong> {@link #withCustomId(String)} — the delay only
     * can be applied to a build that is being created or reused via customId.
     *
     * @param delay build finish delay in seconds to accept more Visual sessions
     */
    public Builder withBuildFinishDelay(Duration delay) {
      if (delay != null && delay.isNegative()) {
        throw new IllegalArgumentException("finishDelay must not be negative");
      }
      this.finishDelay = delay;
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

    /** Tags to add to the build. Overrides {@code SAUCE_VISUAL_TAGS}. */
    public Builder withTags(List<String> tags) {
      this.tags = tags;
      return this;
    }

    /** Tags to add to the build. Overrides {@code SAUCE_VISUAL_TAGS}. */
    public Builder withTags(String... tags) {
      return withTags(Arrays.asList(tags));
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

    public Builder withBaselineOverride(BaselineOverride baselineOverride) {
      this.baselineOverride = baselineOverride;
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

      BuildAttributes attrs =
          new BuildAttributes(
              buildName, projectName, branchName, defaultBranchName, tags, buildId, customId);
      attrs.useBuildDelay(finishDelay);
      return attrs;
    }

    public VisualApi build() {
      validate();

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
      if (this.baselineOverride != null) {
        api.setBaselineOverride(this.baselineOverride);
      }

      return api;
    }

    void validate() {
      if ((this.customId == null || this.customId.trim().isEmpty()) && this.finishDelay != null) {
        throw new IllegalStateException(
            "withBuildFinishDelay(...) requires withCustomId(...) to be called.");
      }
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
  private BaselineOverride baselineOverride;
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
    this(
        driver,
        url,
        username,
        accessKey,
        new BuildAttributes(null, null, null, null, null, null, null));
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

  public void setBaselineOverride(BaselineOverride baselineOverride) {
    this.baselineOverride = baselineOverride;
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
    private final List<String> tags;

    private final String buildId;
    private final String customId;
    private final EnvironmentVariableProvider env;
    private Duration finishDelay;

    public BuildAttributes(
        String name,
        String project,
        String branch,
        String defaultBranch,
        List<String> tags,
        String buildId,
        String customId) {
      this(
          name,
          project,
          branch,
          defaultBranch,
          tags,
          buildId,
          customId,
          EnvironmentVariableProvider.DEFAULT);
    }

    BuildAttributes(
        String name,
        String project,
        String branch,
        String defaultBranch,
        List<String> tags,
        String buildId,
        String customId,
        EnvironmentVariableProvider env) {
      this.name = name;
      this.project = project;
      this.branch = branch;
      this.defaultBranch = defaultBranch;
      this.tags = tags;
      this.buildId = buildId;
      this.customId = customId;
      this.env = env != null ? env : EnvironmentVariableProvider.DEFAULT;
    }

    void useBuildDelay(Duration finishDelay) {
      this.finishDelay = finishDelay;
    }

    public Duration getBuildDelay() {
      return finishDelay;
    }

    public String getName() {
      if (isNotBlank(env.getBuildNameDeprecated())) {
        log.warn(
            "Sauce Labs Visual: Environment variable \"BUILD_NAME\" is deprecated and will be removed in a future version. Please use \"SAUCE_VISUAL_BUILD_NAME\" instead.");
      }
      return valueOrDefault(valueOrDefault(name, env.getBuildName()), env.getBuildNameDeprecated());
    }

    public String getProject() {
      return valueOrDefault(project, env.getProjectName());
    }

    public String getBranch() {
      return valueOrDefault(branch, env.getBranchName());
    }

    public String getDefaultBranch() {
      return valueOrDefault(defaultBranch, env.getDefaultBranchName());
    }

    public String getBuildId() {
      return valueOrDefault(buildId, env.getBuildId());
    }

    public String getCustomId() {
      return valueOrDefault(customId, env.getCustomId());
    }

    /** The tags passed in code, otherwise those from {@code SAUCE_VISUAL_TAGS}. */
    public List<String> getTags() {
      return tags != null ? tags : EnvironmentVariables.parseTags(EnvironmentVariables.TAGS);
    }
  }

  VisualBuild createBuild(String buildName) {
    return createBuild(new BuildAttributes(buildName, null, null, null, null, null, null, null));
  }

  VisualBuild createBuild(BuildAttributes buildAttributes) {
    CreateBuildMutation mutation =
        new CreateBuildMutation(
            new CreateBuildMutation.BuildIn(
                buildAttributes.getName(),
                buildAttributes.getProject(),
                buildAttributes.getBranch(),
                buildAttributes.getDefaultBranch(),
                buildAttributes.getTags(),
                buildAttributes.getCustomId()));
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
    return finishBuild(buildId, null);
  }

  /**
   * Executes a finishBuild mutation with optional delay
   *
   * @param buildId Build id
   * @param delay Build finish delay
   * @return Finished build
   */
  FinishBuildMutation.Result finishBuild(String buildId, Duration delay) {
    Integer delaySeconds = delay == null ? null : Math.toIntExact(delay.getSeconds());
    FinishBuildMutation mutation =
        new FinishBuildMutation(new FinishBuildMutation.FinishBuildIn(buildId, delaySeconds));
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

    BaselineOverride baselineOverride = getBaselineOverride(options);
    if (baselineOverride != null) {
      input.setBaselineOverride(baselineOverride);
    }

    CreateSnapshotFromWebDriverMutation mutation = new CreateSnapshotFromWebDriverMutation(input);
    CreateSnapshotFromWebDriverMutation.Data check =
        this.client.execute(mutation, CreateSnapshotFromWebDriverMutation.Data.class);

    return this.addUploadedDiffIds(check != null ? check.result : null);
  }

  /**
   * Expose execute binding directly, allowing queries to the Visual API using the existing client.
   */
  public <D> D execute(GraphQLOperation operation, Class<D> responseType) {
    return this.client.execute(operation, responseType);
  }

  private String sauceVisualCheckLocal(String snapshotName, CheckOptions options) {
    Capabilities caps = driver.getCapabilities();
    Window window = new Window(this.driver);
    Map<String, Object> windowDims = getWindowDimensions(caps);
    double devicePixelRatio = formatDevicePixelRatio(windowDims.get("dpr"));
    boolean fullPage = options.getFullPageScreenshotConfig() != null;
    WebElement clipElement = getClipElement(options);
    Point clipOffset = new Point(0, 0);
    Rectangle clipRect = null;

    if (clipElement != null) {
      Rectangle clipElementDims = scrollToAndGetClipElementDims(fullPage, clipElement, caps);

      clipRect =
          new Rectangle(
              (int) Math.round(clipElementDims.getX() * devicePixelRatio),
              (int) Math.round(clipElementDims.getY() * devicePixelRatio),
              (int) Math.round(clipElementDims.getHeight() * devicePixelRatio),
              (int) Math.round(clipElementDims.getWidth() * devicePixelRatio));

      clipOffset = new Point(clipElementDims.getX(), clipElementDims.getY());
    }

    // Needs to be queried after our clipElement block due to potential scrolling if fullPage=false.
    // Native apps have no single document scroll position, so there's nothing to query.
    Point scrollOffset =
        fullPage || isNativeMobileApp(caps) ? new Point(0, 0) : window.getViewport().getPoint();
    byte[] screenshot = getScreenshot(fullPage);

    // Handle clipping, if rect is present
    if (clipRect != null) {
      Dimension imageDims = ImageHelpers.getImageDimensions(screenshot);
      // bound the clip rect to the image bounds so there is no outside of bounds exception
      Optional<Rectangle> offsetRect =
          CartesianHelpers.intersect(clipRect, new Rectangle(new Point(0, 0), imageDims));

      if (offsetRect.isPresent()) {
        screenshot =
            ImageHelpers.saveImage(
                ImageHelpers.cropImage(ImageHelpers.loadImage(screenshot), offsetRect.get()),
                "png");
      } else {
        throw new VisualApiException("Clipping would result in an empty image");
      }
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
    if (isNativeMobileApp(caps) && !fullPage) {
      ignoreRegions.addAll(getSystemBarIgnoreRegions(caps));
    }

    // get adjusted screenshot dimensions
    Dimension imageDims = ImageHelpers.getImageDimensions(screenshot);
    Rectangle imageDimsDpr =
        new Rectangle(
            new Point(0, 0),
            new Dimension(
                (int) Math.round(imageDims.getWidth() / devicePixelRatio),
                (int) Math.round(imageDims.getHeight() / devicePixelRatio)));
    String deviceName = getDeviceName(caps, windowDims);

    // make regions relative to viewport
    List<RegionIn> visibleIgnoreRegions = new ArrayList<>();
    for (RegionIn region : ignoreRegions) {
      // Update the offset to all ignore regions
      Point newPoint =
          CartesianHelpers.relativeTo(clipOffset, new Point(region.getX(), region.getY()));
      region.setX(newPoint.x - scrollOffset.getX());
      region.setY(newPoint.y - scrollOffset.getY());

      Rectangle regionRect =
          new Rectangle(region.getX(), region.getY(), region.getHeight(), region.getWidth());
      // Only add it if the region is visible inside the new image
      if (CartesianHelpers.intersect(regionRect, imageDimsDpr).isPresent()) {
        visibleIgnoreRegions.add(region);
      }
    }

    // upload image
    this.client.upload(uploadResult.getImageUploadUrl(), screenshot, "image/png");

    // upload dom if present / enabled
    Boolean shouldCaptureDom = Optional.ofNullable(options.getCaptureDom()).orElse(this.captureDom);
    if (shouldCaptureDom != null && shouldCaptureDom) {
      uploadDom(uploadResult, caps);
    }

    // create snapshot using upload id
    CreateSnapshotMutation snapshotMutation =
        new CreateSnapshotMutation(
            SnapshotIn.builder()
                .withBrowser(CapabilityUtils.getBrowser(caps))
                .withBrowserVersion(CapabilityUtils.getBrowserVersion(caps))
                .withDevice(deviceName)
                .withDevicePixelRatio(devicePixelRatio)
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
                .withBaselineOverride(
                    Optional.ofNullable(getBaselineOverride(options))
                        .map(BaselineOverride::asGraphQLType)
                        .orElse(null))
                .withName(snapshotName)
                .build());
    CreateSnapshotMutation.Data result =
        this.client.execute(snapshotMutation, CreateSnapshotMutation.Data.class);

    return this.addUploadedDiffIds(result != null ? result.result : null);
  }

  private String addUploadedDiffIds(SnapshotDiffResult result) {
    if (result != null) {
      uploadedDiffIds.addAll(result.diffIds);

      return result.id;
    }

    return null;
  }

  /**
   * Full-page capture relies on WebDriver BiDi, which isn't available on sessions proxied through
   * Appium (e.g. mobile browsers). Fall back to a standard screenshot in that case.
   */
  private byte[] getScreenshot(boolean fullPage) {
    if (fullPage) {
      try {
        BrowsingContext browsingContext = new BrowsingContext(driver, driver.getWindowHandle());
        CaptureScreenshotParameters csp = new CaptureScreenshotParameters();
        csp.origin(CaptureScreenshotParameters.Origin.DOCUMENT);
        String screenshot = browsingContext.captureScreenshot(csp);
        return OutputType.BYTES.convertFromBase64Png(screenshot);
      } catch (WebDriverException e) {
        // No BiDi support on this session - fall through to a standard screenshot.
        return driver.getScreenshotAs(OutputType.BYTES);
      }
    }

    return driver.getScreenshotAs(OutputType.BYTES);
  }

  /**
   * A native mobile app session (Appium with "appium:app" rather than "browserName") has no DOM, so
   * none of our JS snippets can run against it. Mobile *web* sessions (browserName set, even on
   * Android/iOS) are real browsers and run JS the same as desktop.
   */
  private boolean isNativeMobileApp(Capabilities caps) {
    String browserName = caps.getBrowserName();
    if (!browserName.isEmpty()) {
      return false;
    }

    OperatingSystem os = CapabilityUtils.getOperatingSystem(caps);
    return os == OperatingSystem.ANDROID || os == OperatingSystem.IOS;
  }

  /**
   * Computes ignore regions for native system chrome (the status bar, and on Android the navigation
   * bar) so automatic diffing doesn't flag OS-level UI that isn't part of the app under test.
   */
  private List<RegionIn> getSystemBarIgnoreRegions(Capabilities caps) {
    List<RegionIn> regions = new ArrayList<>();
    OperatingSystem os = CapabilityUtils.getOperatingSystem(caps);

    if (os == OperatingSystem.IOS) {
      Map<String, Object> screenInfo =
          (Map<String, Object>) driver.executeScript("mobile: deviceScreenInfo");
      Map<String, Object> statusBarSize = (Map<String, Object>) screenInfo.get("statusBarSize");
      if (statusBarSize != null) {
        regions.add(toSystemBarIgnoreRegion("auto: System Status Bar", 0, 0, statusBarSize));
      }
      return regions;
    }

    Map<String, Object> systemBars;
    try {
      systemBars = (Map<String, Object>) driver.executeScript("mobile: getSystemBars");
    } catch (WebDriverException e) {
      // "mobile: getSystemBars" needs a newer Appium/UiAutomator2 version; skip auto ignore
      // regions rather than failing the whole check when it's unavailable.
      return regions;
    }

    Map<String, Object> statusBar = (Map<String, Object>) systemBars.get("statusBar");
    if (statusBar != null) {
      regions.add(toSystemBarIgnoreRegion("auto: System Status Bar", 0, 0, statusBar));
    }

    Map<String, Object> navigationBar = (Map<String, Object>) systemBars.get("navigationBar");
    if (navigationBar != null
        && Boolean.TRUE.equals(navigationBar.get("visible"))
        && toInt(navigationBar.get("height")) > 0
        && toInt(navigationBar.get("width")) > 0) {
      regions.add(
          toSystemBarIgnoreRegion(
              "auto: System Navigation Bar",
              toInt(navigationBar.get("x")),
              toInt(navigationBar.get("y")),
              navigationBar));
    }

    return regions;
  }

  private RegionIn toSystemBarIgnoreRegion(String name, int x, int y, Map<String, Object> dims) {
    return VisualRegion.ignoreChangesFor(
            name, x, y, toInt(dims.get("width")), toInt(dims.get("height")))
        .toRegionIn();
  }

  private static int toInt(Object value) {
    return ((Number) value).intValue();
  }

  /**
   * Query the dimensions and offset of the current clip element after scrolling to it, if
   * applicable. Uses the WebElement's native rect directly on native mobile app sessions, which
   * have no DOM to query via JS.
   */
  private Rectangle scrollToAndGetClipElementDims(
      boolean fullPage, WebElement clipElement, Capabilities caps) {
    if (isNativeMobileApp(caps)) {
      return clipElement.getRect();
    }

    final String getElementDimensions =
        "const [clipElement, isFullPage] = arguments;\n"
            + "      if (!isFullPage) {\n"
            + "        clipElement.scrollIntoView({\n"
            + "          behavior: 'instant',\n"
            + "        });\n"
            + "      }\n"
            + "      const rect = clipElement.getBoundingClientRect().toJSON();\n"
            + "      return isFullPage ? {\n"
            + "        // FPS should use original coordinates of element on page\n"
            + "        width: Math.round(rect.width),\n"
            + "        height: Math.round(rect.height),\n"
            + "        x: Math.round(rect.x + window.scrollX),\n"
            + "        y: Math.round(rect.y + window.scrollY),\n"
            + "      } : {"
            + "        width: Math.round(rect.width),\n"
            + "        height: Math.round(rect.height),\n"
            + "        x: Math.round(rect.x),\n"
            + "        y: Math.round(rect.y),\n"
            + "      };";

    Map<String, Long> clipMap =
        (Map<String, Long>) driver.executeScript(getElementDimensions, clipElement, fullPage);

    return new Rectangle(
        clipMap.get("x").intValue(),
        clipMap.get("y").intValue(),
        clipMap.get("height").intValue(),
        clipMap.get("width").intValue());
  }

  /**
   * Query the browser's viewport size and device pixel ratio. Uses the WebDriver-native window size
   * and device-specific pixel ratio directly on native mobile app sessions.
   */
  private Map<String, Object> getWindowDimensions(Capabilities caps) {
    if (isNativeMobileApp(caps)) {
      Dimension size = driver.manage().window().getSize();
      Map<String, Object> windowDims = new HashMap<>();
      windowDims.put("height", size.getHeight());
      windowDims.put("width", size.getWidth());
      windowDims.put("dpr", getNativeDevicePixelRatio(caps));
      return windowDims;
    }

    return (Map<String, Object>)
        driver.executeScript(
            "return { height: window.innerHeight, width: window.innerWidth, dpr: window.devicePixelRatio }");
  }

  /**
   * Returns the device pixel ratio for a native mobile app session - i.e. the scaling factor needed
   * to convert element/clip coordinates into the same space as the screenshot's pixels. Only iOS
   * needs this: XCUITest reports element rects in points while screenshots are captured at the
   * native pixel resolution, so the UIScreen "scale" factor (e.g. 2 or 3) is required to align the
   * two. Android's UiAutomator2 already reports element rects in the same raw pixel space as its
   * screenshots - its display "density" is a different, dp-conversion concept and isn't a stand-in
   * for this, so no scaling is applied there.
   */
  private double getNativeDevicePixelRatio(Capabilities caps) {
    if (CapabilityUtils.getOperatingSystem(caps) != OperatingSystem.IOS) {
      return 1.0;
    }

    Map<String, Object> screenInfo =
        (Map<String, Object>) driver.executeScript("mobile: deviceScreenInfo");
    Object scale = screenInfo.get("scale");
    return scale instanceof Number ? ((Number) scale).doubleValue() : 1.0;
  }

  /**
   * Captures the current DOM and uploads it. Uses WebDriver's native page source (the native view
   * hierarchy XML) directly on native mobile app sessions, which have no DOM to query via JS.
   */
  private void uploadDom(SnapshotUpload uploadResult, Capabilities caps) {
    String dom;
    if (isNativeMobileApp(caps)) {
      dom = wrapNativePageSource(Objects.requireNonNull(this.driver.getPageSource()), caps);
    } else {
      Object result = this.driver.executeScript(this.client.getDomCaptureScript());
      dom = result instanceof String ? (String) result : null;
    }

    if (dom != null) {
      this.client.upload(uploadResult.getDomUploadUrl(), dom.getBytes(), "text/html");
    } else {
      System.out.println("Failed to capture Visual DOM.");
    }
  }

  /**
   * Wraps a native app's page source (its XML view hierarchy) in a custom root element naming the
   * platform it came from - "android-page-source" or "ios-page-source" - so downstream DOM viewers
   * can tell a native view hierarchy apart from a captured web DOM.
   */
  private String wrapNativePageSource(String pageSource, Capabilities caps) {
    String rootElementName =
        CapabilityUtils.getOperatingSystem(caps) == OperatingSystem.ANDROID
            ? "android-page-source"
            : "ios-page-source";
    // The root element can only appear once, so drop any XML declaration the page source itself
    // starts with - the wrapper below provides its own.
    String body = pageSource.replaceFirst("^\\s*<\\?xml[^>]*\\?>\\s*", "");

    return "<!DOCTYPE "
        + rootElementName
        + ">\n<"
        + rootElementName
        + ">"
        + body
        + "</"
        + rootElementName
        + ">";
  }

  /**
   * Returns a human-readable device name. For Android/iOS sessions, queries the device directly via
   * Appium's "mobile: deviceInfo" command rather than trusting the "deviceName" capability -
   * Appium's own drivers frequently overwrite that capability with the device's raw UDID/serial for
   * real devices instead of anything human-readable (see
   * https://github.com/appium/appium/issues/8454). Falls back to a generic desktop resolution label
   * for non-mobile sessions.
   */
  private String getDeviceName(Capabilities caps, Map<String, Object> windowDims) {
    OperatingSystem os = CapabilityUtils.getOperatingSystem(caps);
    if (os == OperatingSystem.ANDROID || os == OperatingSystem.IOS) {
      return getMobileDeviceInfoName(os);
    }

    return String.format("Desktop (%sx%s)", windowDims.get("width"), windowDims.get("height"));
  }

  /**
   * Builds a device label from Appium's "mobile: deviceInfo" command. Android reports
   * "manufacturer" and "model" straight from the OS (e.g. "Google Pixel 8"). iOS only reports the
   * generic device family via "name"/"model" (e.g. "iPhone") - Apple doesn't expose the specific
   * marketing name (e.g. "iPhone 15 Pro") through any public API, so this is the most specific
   * label iOS can give.
   */
  private String getMobileDeviceInfoName(OperatingSystem os) {
    Map<String, Object> deviceInfo =
        (Map<String, Object>) driver.executeScript("mobile: deviceInfo");

    if (os == OperatingSystem.ANDROID) {
      Object manufacturer = deviceInfo.get("manufacturer");
      Object model = deviceInfo.get("model");
      return (manufacturer instanceof String ? manufacturer + " " : "") + model;
    }

    Object name = deviceInfo.get("name");
    return name instanceof String && !((String) name).isEmpty()
        ? (String) name
        : String.valueOf(deviceInfo.get("model"));
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

  private BaselineOverride getBaselineOverride(CheckOptions checkOptions) {
    BaselineOverride baselineOverride = checkOptions.getBaselineOverride();
    return baselineOverride != null ? baselineOverride : this.baselineOverride;
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
      WebElement element = region.getElement();
      if (element != null) {
        bulkWebElements.add(element);
        bulkRegions.add(region);
      } else if (validate(region) == null) {
        throw new InvalidVisualRegionException(region, "Visual region is invalid");
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
      result.add(new VisualRegion(region.getName(), rectangle, region.getOptions()).toRegionIn());
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
