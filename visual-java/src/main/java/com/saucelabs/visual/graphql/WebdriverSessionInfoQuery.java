package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.Browser;
import com.saucelabs.visual.graphql.type.OperatingSystem;
import java.util.Collections;
import java.util.Map;

public class WebdriverSessionInfoQuery implements GraphQLOperation {

  /**
   * The minimized GraphQL document being sent to the server to save a few bytes. The un-minimized
   * version is:
   *
   * <p>query webdriverSessionInfo($input: WebdriverSessionInfoIn!) { result:
   * webdriverSessionInfo(input: $input) { blob operatingSystem operatingSystemVersion browser
   * browserVersion deviceName } }
   */
  public static final String OPERATION_DOCUMENT =
      "query webdriverSessionInfo($input: WebdriverSessionInfoIn!) { result: webdriverSessionInfo(input: $input) { blob operatingSystem operatingSystemVersion browser browserVersion deviceName } }";

  public static class WebdriverSessionInfoIn {
    public final String jobId;

    public final String sessionId;

    public WebdriverSessionInfoIn(String jobId, String sessionId) {
      this.jobId = jobId;
      this.sessionId = sessionId;
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
      return "WebdriverSessionInfoQuery.Data{" + "result=" + result + '}';
    }
  }

  public static class Result {

    public String blob;

    public OperatingSystem operatingSystem;

    public String operatingSystemVersion;

    public Browser browser;

    public String browserVersion;

    public String deviceName;

    public Result(
        @JsonProperty("blob") String blob,
        @JsonProperty("operatingSystem") OperatingSystem operatingSystem,
        @JsonProperty("operatingSystemVersion") String operatingSystemVersion,
        @JsonProperty("browser") Browser browser,
        @JsonProperty("browserVersion") String browserVersion,
        @JsonProperty("deviceName") String deviceName) {
      this.blob = blob;
      this.operatingSystem = operatingSystem;
      this.operatingSystemVersion = operatingSystemVersion;
      this.browser = browser;
      this.browserVersion = browserVersion;
      this.deviceName = deviceName;
    }

    @Override
    public String toString() {
      return "WebdriverSessionInfoQuery.Result{"
          + "blob='"
          + blob
          + '\''
          + ", operatingSystem="
          + operatingSystem
          + ", operatingSystemVersion='"
          + operatingSystemVersion
          + '\''
          + ", browser="
          + browser
          + ", browserVersion='"
          + browserVersion
          + '\''
          + ", deviceName='"
          + deviceName
          + '\''
          + '}';
    }
  }

  private final WebdriverSessionInfoIn input;

  public WebdriverSessionInfoQuery(WebdriverSessionInfoIn input) {
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
