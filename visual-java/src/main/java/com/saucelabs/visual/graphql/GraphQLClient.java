package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.utils.ArtifactVersion;
import java.io.IOException;
import java.util.Base64;
import org.apache.http.HttpEntity;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

public class GraphQLClient {

  private final String uri;
  private final HttpClient client;
  private final String authentication;

  private final ObjectMapper objectMapper;

  public GraphQLClient(String uri, String username, String accessKey) {
    this(HttpClients.createSystem(), uri, username, accessKey);
  }

  public GraphQLClient(HttpClient client, String uri, String username, String accessKey) {
    this.client = client;
    this.uri = uri;
    this.authentication =
        Base64.getEncoder().encodeToString((username + ":" + accessKey).getBytes());

    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new Jdk8Module());
    objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    this.objectMapper = objectMapper;
  }

  public <D> D execute(GraphQLOperation operation, Class<D> responseType)
      throws VisualApiException {
    try {
      HttpPost request = new HttpPost(this.uri);
      request.setHeader(HttpHeaders.CONTENT_TYPE, "application/json");
      request.setHeader(HttpHeaders.ACCEPT, "application/json");
      request.setHeader(HttpHeaders.AUTHORIZATION, "Basic " + authentication);
      request.setHeader(
          HttpHeaders.USER_AGENT,
          "sauce-visual-java/" + ArtifactVersion.getArtifactVersion().orElse("unknown"));

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

      return objectMapper.treeToValue(dataField, responseType);
    } catch (IOException e) {
      throw new VisualApiException("error while executing request", e);
    }
  }
}
