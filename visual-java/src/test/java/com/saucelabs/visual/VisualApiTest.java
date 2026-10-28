package com.saucelabs.visual;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.saucelabs.visual.graphql.*;
import com.saucelabs.visual.graphql.type.BuildStatus;
import com.saucelabs.visual.graphql.type.Diff;
import com.saucelabs.visual.graphql.type.DiffStatus;
import com.saucelabs.visual.graphql.type.DiffsConnection;
import com.saucelabs.visual.graphql.type.RegionIn;
import com.saucelabs.visual.graphql.type.SnapshotUpload;
import com.saucelabs.visual.utils.BulkDriverHelper;
import com.saucelabs.visual.utils.ImageHelpers;
import java.awt.image.BufferedImage;
import com.saucelabs.visual.utils.EnvironmentVariables;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.platform.commons.util.ReflectionUtils;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.WebDriverException;
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
  void createBuildSendsTags() {
    when(mockGraphQLClient.execute(any(), eq(CreateBuildMutation.Data.class)))
        .thenReturn(
            new CreateBuildMutation.Data(
                new CreateBuildMutation.Result(
                    "id", "Build", null, null, null, BuildStatus.RUNNING, "http://build")));

    api.createBuild(
        new VisualApi.BuildAttributes(
            "Build", null, null, null, Arrays.asList("smoke", "nightly"), null, null));

    ArgumentCaptor<CreateBuildMutation> mutation =
        ArgumentCaptor.forClass(CreateBuildMutation.class);
    verify(mockGraphQLClient).execute(mutation.capture(), eq(CreateBuildMutation.Data.class));
    CreateBuildMutation.BuildIn input =
        (CreateBuildMutation.BuildIn) mutation.getValue().getVariables().get("input");
    assertEquals(Arrays.asList("smoke", "nightly"), input.getTags());
  }

  @Test
  void tagsInCodeOverrideTheEnvironment() {
    List<String> tags = Collections.singletonList("from-code");
    assertEquals(
        tags, new VisualApi.BuildAttributes(null, null, null, null, tags, null, null).getTags());
    // Without tags in code, SAUCE_VISUAL_TAGS is used (when it's set).
    assertEquals(
        EnvironmentVariables.parseTags(EnvironmentVariables.TAGS),
        new VisualApi.BuildAttributes(null, null, null, null, null, null, null).getTags());
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
                        .withNodes(
                            Collections.singletonList(Diff.builder().withId(mockDiffId).build()))
                        .build())));

    String result = api.sauceVisualCheck("test name");
    assertEquals(mockVisualId, result);
    List<String> uploadedIds = (List<String>) getField(api, "uploadedDiffIds");
    assertEquals(uploadedIds, Collections.singletonList(mockDiffId));
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
                        .withNodes(
                            Collections.singletonList(Diff.builder().withId(mockDiffId).build()))
                        .build())));

    String result = api.sauceVisualCheck("test name");
    assertEquals(mockLocalId, result);
    List<String> uploadedIds = (List<String>) getField(api, "uploadedDiffIds");
    assertEquals(uploadedIds, Collections.singletonList(mockDiffId));
  }

  @Test
  void isNativeMobileAppTest() throws ReflectiveOperationException {
    assertTrue(isNativeMobileApp(mobileCaps("Android", null)));
    assertTrue(isNativeMobileApp(mobileCaps("iOS", null)));
    assertFalse(isNativeMobileApp(mobileCaps("Android", "chrome")));
    assertFalse(isNativeMobileApp(mobileCaps("iOS", "safari")));
    assertFalse(isNativeMobileApp(mobileCaps("Windows 10", "chrome")));
  }

  @Test
  void isMobileWebBrowserTest() throws ReflectiveOperationException {
    assertTrue(isMobileWebBrowser(mobileCaps("Android", "chrome")));
    assertTrue(isMobileWebBrowser(mobileCaps("iOS", "safari")));
    assertFalse(isMobileWebBrowser(mobileCaps("Android", null)));
    assertFalse(isMobileWebBrowser(mobileCaps("iOS", null)));
    assertFalse(isMobileWebBrowser(mobileCaps("Windows 10", "chrome")));
  }

  @Test
  void getSystemBarIgnoreRegionsIosTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: deviceScreenInfo"))
        .thenReturn(mapOf("statusBarSize", mapOf("width", 414L, "height", 48L)));

    List<RegionIn> regions = getSystemBarIgnoreRegions(mobileCaps("iOS", null));

    assertEquals(1, regions.size());
    assertEquals("auto: System Status Bar", regions.get(0).getName());
    assertEquals(0, regions.get(0).getX());
    assertEquals(0, regions.get(0).getY());
    assertEquals(414, regions.get(0).getWidth());
    assertEquals(48, regions.get(0).getHeight());
  }

  @Test
  void getSystemBarIgnoreRegionsAndroidTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: getSystemBars"))
        .thenReturn(
            mapOf(
                "statusBar", mapOf("width", 1080L, "height", 100L),
                "navigationBar",
                    mapOf(
                        "visible", true,
                        "x", 0L,
                        "y", 2200L,
                        "width", 1080L,
                        "height", 120L)));

    List<RegionIn> regions = getSystemBarIgnoreRegions(mobileCaps("Android", null));

    assertEquals(2, regions.size());
    assertEquals("auto: System Status Bar", regions.get(0).getName());
    assertEquals("auto: System Navigation Bar", regions.get(1).getName());
    assertEquals(2200, regions.get(1).getY());
  }

  @Test
  void getSystemBarIgnoreRegionsAndroidHiddenNavBarTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: getSystemBars"))
        .thenReturn(
            mapOf(
                "statusBar", mapOf("width", 1080L, "height", 100L),
                "navigationBar", mapOf("visible", false, "x", 0L, "y", 0L, "width", 0L, "height", 0L)));

    List<RegionIn> regions = getSystemBarIgnoreRegions(mobileCaps("Android", null));

    assertEquals(1, regions.size());
    assertEquals("auto: System Status Bar", regions.get(0).getName());
  }

  @Test
  void getSystemBarIgnoreRegionsAndroidUnsupportedTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: getSystemBars"))
        .thenThrow(new WebDriverException("unsupported"));

    List<RegionIn> regions = getSystemBarIgnoreRegions(mobileCaps("Android", null));

    assertTrue(regions.isEmpty());
  }

  @Test
  void getNativeDevicePixelRatioIosTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: deviceScreenInfo"))
        .thenReturn(mapOf("scale", 3L, "statusBarSize", mapOf("width", 414L, "height", 48L)));

    assertEquals(3.0, getNativeDevicePixelRatio(mobileCaps("iOS", null)));
  }

  @Test
  void getNativeDevicePixelRatioAndroidDefaultsWithoutQueryingDeviceTest()
      throws ReflectiveOperationException {
    assertEquals(1.0, getNativeDevicePixelRatio(mobileCaps("Android", null)));
    verify(mockDriver, never()).executeScript(any(String.class));
  }

  @Test
  void getDeviceNameAndroidTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: deviceInfo"))
        .thenReturn(mapOf("manufacturer", "Google", "model", "Pixel 8"));

    assertEquals("Google Pixel 8", getDeviceName(mobileCaps("Android", null), mapOf()));
  }

  @Test
  void getDeviceNameIosPrefersNameOverModelTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: deviceInfo"))
        .thenReturn(mapOf("name", "iPhone", "model", "iPhone"));

    assertEquals("iPhone", getDeviceName(mobileCaps("iOS", null), mapOf()));
  }

  @Test
  void getDeviceNameIosFallsBackToModelWhenNameIsEmptyTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: deviceInfo")).thenReturn(mapOf("name", "", "model", "iPhone"));

    assertEquals("iPhone", getDeviceName(mobileCaps("iOS", null), mapOf()));
  }

  @Test
  void getDeviceNameDesktopTest() throws ReflectiveOperationException {
    assertEquals(
        "Desktop (1920x1080)",
        getDeviceName(mobileCaps("Windows 10", "chrome"), mapOf("width", 1920L, "height", 1080L)));
  }

  @Test
  void wrapNativePageSourceTest() throws ReflectiveOperationException {
    String androidResult =
        wrapNativePageSource("<?xml version='1.0'?><hierarchy/>", mobileCaps("Android", null));
    assertTrue(androidResult.startsWith("<!DOCTYPE android-page-source>\n<android-page-source>"));
    assertTrue(androidResult.endsWith("</android-page-source>"));
    assertFalse(androidResult.contains("<?xml"));

    String iosResult = wrapNativePageSource("<AppiumAUT/>", mobileCaps("iOS", null));
    assertTrue(iosResult.startsWith("<!DOCTYPE ios-page-source>\n<ios-page-source>"));
    assertTrue(iosResult.endsWith("</ios-page-source>"));
  }

  @Test
  void cropMobileWebChromeAndroidUsesRawPixelsTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: getSystemBars"))
        .thenReturn(mapOf("statusBar", mapOf("width", 1080L, "height", 100L)));
    // Screenshot has extra margin on both axes so a correct crop must trim it, not pass it through.
    byte[] screenshot = solidPng(1200, 2500);

    byte[] cropped =
        cropMobileWebChrome(
            screenshot, mobileCaps("Android", "chrome"), mapOf("width", 1080L, "height", 2000L), 1.0);

    Dimension dims = ImageHelpers.getImageDimensions(cropped);
    assertEquals(1080, dims.getWidth());
    assertEquals(2000, dims.getHeight());
  }

  @Test
  void cropMobileWebChromeIosScalesStatusBarByDprTest() throws ReflectiveOperationException {
    when(mockDriver.executeScript("mobile: deviceScreenInfo"))
        .thenReturn(mapOf("statusBarSize", mapOf("width", 414L, "height", 47L)));
    double dpr = 3.0;
    // Screenshot has extra margin on both axes so a correct crop must trim it, not pass it through.
    byte[] screenshot = solidPng((int) Math.round(414 * dpr) + 50, 2688);

    byte[] cropped =
        cropMobileWebChrome(
            screenshot, mobileCaps("iOS", "safari"), mapOf("width", 414L, "height", 715L), dpr);

    Dimension dims = ImageHelpers.getImageDimensions(cropped);
    assertEquals((int) Math.round(414 * dpr), dims.getWidth());
    assertEquals((int) Math.round(715 * dpr), dims.getHeight());
  }

  // --- Test helpers for the private methods above ---

  private static Capabilities mobileCaps(String platformName, String browserName) {
    MutableCapabilities caps = new MutableCapabilities();
    caps.setCapability("platformName", platformName);
    if (browserName != null) {
      caps.setCapability("browserName", browserName);
    }
    return caps;
  }

  private static Map<String, Object> mapOf(Object... keysAndValues) {
    Map<String, Object> map = new HashMap<>();
    for (int i = 0; i < keysAndValues.length; i += 2) {
      map.put((String) keysAndValues[i], keysAndValues[i + 1]);
    }
    return map;
  }

  private static byte[] solidPng(int width, int height) {
    return ImageHelpers.saveImage(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png");
  }

  private boolean isNativeMobileApp(Capabilities caps) throws ReflectiveOperationException {
    return (boolean) invoke(api, "isNativeMobileApp", new Class<?>[] {Capabilities.class}, caps);
  }

  private boolean isMobileWebBrowser(Capabilities caps) throws ReflectiveOperationException {
    return (boolean) invoke(api, "isMobileWebBrowser", new Class<?>[] {Capabilities.class}, caps);
  }

  @SuppressWarnings("unchecked")
  private List<RegionIn> getSystemBarIgnoreRegions(Capabilities caps)
      throws ReflectiveOperationException {
    return (List<RegionIn>)
        invoke(api, "getSystemBarIgnoreRegions", new Class<?>[] {Capabilities.class}, caps);
  }

  private double getNativeDevicePixelRatio(Capabilities caps) throws ReflectiveOperationException {
    return (double)
        invoke(api, "getNativeDevicePixelRatio", new Class<?>[] {Capabilities.class}, caps);
  }

  private String getDeviceName(Capabilities caps, Map<String, Object> windowDims)
      throws ReflectiveOperationException {
    return (String)
        invoke(api, "getDeviceName", new Class<?>[] {Capabilities.class, Map.class}, caps, windowDims);
  }

  private String wrapNativePageSource(String pageSource, Capabilities caps)
      throws ReflectiveOperationException {
    return (String)
        invoke(
            api,
            "wrapNativePageSource",
            new Class<?>[] {String.class, Capabilities.class},
            pageSource,
            caps);
  }

  private byte[] cropMobileWebChrome(
      byte[] screenshot, Capabilities caps, Map<String, Object> windowDims, double devicePixelRatio)
      throws ReflectiveOperationException {
    return (byte[])
        invoke(
            api,
            "cropMobileWebChrome",
            new Class<?>[] {byte[].class, Capabilities.class, Map.class, double.class},
            screenshot,
            caps,
            windowDims,
            devicePixelRatio);
  }

  private static Object invoke(Object target, String methodName, Class<?>[] paramTypes, Object... args)
      throws ReflectiveOperationException {
    Method method = target.getClass().getDeclaredMethod(methodName, paramTypes);
    method.setAccessible(true);
    return method.invoke(target, args);
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
