package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.utils.ArtifactVersion;
import java.io.IOException;
import java.net.URI;
import java.util.Base64;
import org.apache.http.HttpEntity;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

public class GraphQLClient {

  private final String uri;
  private final HttpClient client;
  private final String authentication;
  private final String staticUrl;
  private static String domCaptureScript;

  private final ObjectMapper objectMapper;
  private RequestConfig requestConfig = RequestConfig.DEFAULT;

  public GraphQLClient(String uri, String username, String accessKey) {
    this(HttpClients.createSystem(), uri, username, accessKey);
  }

  public GraphQLClient(String uri, String username, String accessKey, RequestConfig requestConfig) {
    this(HttpClients.createSystem(), uri, username, accessKey, requestConfig);
  }

  public GraphQLClient(HttpClient client, String uri, String username, String accessKey) {
    this(client, uri, username, accessKey, null);
  }

  public GraphQLClient(
      HttpClient client,
      String uri,
      String username,
      String accessKey,
      RequestConfig requestConfig) {
    this.client = client;
    this.uri = uri;
    this.staticUrl = URI.create(uri + "/").resolve("../static/").toString();
    this.authentication =
        Base64.getEncoder().encodeToString((username + ":" + accessKey).getBytes());

    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new Jdk8Module());
    objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    if (requestConfig != null) {
      this.requestConfig = requestConfig;
    }

    this.objectMapper = objectMapper;
  }

  /**
   * Inject the headers & configuration options for interacting with the GraphQL API.
   */
  private void configureRequest(HttpRequestBase request){
    request.setHeader(HttpHeaders.AUTHORIZATION, "Basic " + authentication);
    request.setHeader(
            HttpHeaders.USER_AGENT,
            "sauce-visual-java/" + ArtifactVersion.getArtifactVersion().orElse("unknown"));
    request.setConfig(requestConfig);
  }

  /**
   * Grab our DOM Capture script from the API if not already cached locally.
   */
  public String getDomCaptureScript() {
    if (GraphQLClient.domCaptureScript != null) {
      return GraphQLClient.domCaptureScript;
    }

    String url = this.staticUrl + "browser-scripts/dom-capture.js";
    try {
      HttpGet request = new HttpGet(url);
      configureRequest(request);
      HttpResponse response = this.client.execute(request);
      int status = response.getStatusLine().getStatusCode();
      HttpEntity entity = response.getEntity();
      String responseString = EntityUtils.toString(entity, "UTF-8");

      if (status != 200) {
        throw new VisualApiException("Unexpected status code: " + status + " " + responseString);
      }

      GraphQLClient.domCaptureScript = responseString;
      return responseString;
    } catch (IOException e) {
      throw new VisualApiException(e.getMessage(), e);
    }
  }

  /**
   * Uploads a file to Sauce's visual storage.
   *
   * @param uri The URL retrieved from the createSnapshotUpload mutation.
   * @param content A byte array containing the contents to upload to Visual storage.
   */
  public void upload(String uri, byte[] content, String mimeType) throws VisualApiException {
    HttpPut request = new HttpPut(uri);
    request.setHeader(HttpHeaders.CONTENT_TYPE, mimeType);
    request.setConfig(requestConfig);
    request.setEntity(new ByteArrayEntity(content));

    try {
      client.execute(request);
    } catch (IOException e) {
      throw new VisualApiException(e.getMessage(), e);
    }
  }

  public <D> D execute(GraphQLOperation operation, Class<D> responseType)
      throws VisualApiException {
    try {
      HttpPost request = new HttpPost(this.uri);
      request.setHeader(HttpHeaders.CONTENT_TYPE, "application/json");
      request.setHeader(HttpHeaders.ACCEPT, "application/json");
      configureRequest(request);

      String requestBody = this.objectMapper.writeValueAsString(operation);
      request.setEntity(new StringEntity(requestBody));

      HttpResponse response = client.execute(request);

      HttpEntity entity = response.getEntity();
      int status = response.getStatusLine().getStatusCode();
      String responseString = EntityUtils.toString(entity, "UTF-8");

      if (status < 200 || status >= 300) {
        throw new VisualApiException("Unexpected status code: " + status + " " + responseString);
      }

      JsonNode rootNode = objectMapper.readTree(responseString);
      JsonNode dataField = rootNode.get("data");
      JsonNode errors = rootNode.get("errors");

      if (errors != null) {
        JsonNode message = errors.findValue("message");
        if (message != null) {
          throw new VisualApiException(message.asText());
        } else {
          throw new VisualApiException("Unexpected error");
        }
      }

      return objectMapper.treeToValue(dataField, responseType);
    } catch (IOException e) {
      throw new VisualApiException("error while executing request", e);
    }
  }
}
