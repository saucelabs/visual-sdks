package com.saucelabs.visual.graphql;

import static com.saucelabs.visual.utils.EnvironmentVariables.SAUCE_ACCESS_KEY;
import static com.saucelabs.visual.utils.EnvironmentVariables.SAUCE_USERNAME;

import android.text.TextUtils;
import android.util.Base64;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.model.DataCenter;

import java.io.IOException;

import cz.msebera.android.httpclient.HttpEntity;
import cz.msebera.android.httpclient.HttpHeaders;
import cz.msebera.android.httpclient.HttpResponse;
import cz.msebera.android.httpclient.client.HttpClient;
import cz.msebera.android.httpclient.client.methods.HttpPost;
import cz.msebera.android.httpclient.entity.ContentType;
import cz.msebera.android.httpclient.entity.StringEntity;
import cz.msebera.android.httpclient.impl.client.HttpClients;
import cz.msebera.android.httpclient.util.EntityUtils;

public class GraphQLClient {

    private final String uri;
    private final HttpClient client;
    private final String authentication;

    private final ObjectMapper objectMapper;

    public GraphQLClient() {
        this(DataCenter.fromSauceRegion().endpoint, HttpClients.createSystem());
    }

    public GraphQLClient(HttpClient client) {
        this(DataCenter.fromSauceRegion().endpoint, client);
    }

    public GraphQLClient(String uri) {
        this(uri, HttpClients.createSystem());
    }

    public GraphQLClient(String uri, HttpClient client) {
        if (TextUtils.isEmpty(SAUCE_USERNAME) || TextUtils.isEmpty(SAUCE_ACCESS_KEY)) {
            throw new VisualApiException("SAUCE_USERNAME or SAUCE_ACCESS_KEY is not set");
        }
        this.client = client;
        this.uri = uri;
        this.authentication = Base64.encodeToString((SAUCE_USERNAME + ":" + SAUCE_ACCESS_KEY).getBytes(), Base64.NO_WRAP);
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        this.objectMapper = mapper;
    }

    public <D> D execute(GraphQLOperation operation, Class<D> responseType)
            throws VisualApiException {
        try {
            HttpPost request = new HttpPost(this.uri);
            request.setHeader(HttpHeaders.CONTENT_TYPE, "application/json");
            request.setHeader(HttpHeaders.ACCEPT, "application/json");
            request.setHeader(HttpHeaders.AUTHORIZATION, "Basic " + authentication);
            request.setHeader(HttpHeaders.USER_AGENT, "sauce-visual-espresso/0.0.1");

            String requestBody = this.objectMapper.writeValueAsString(operation);
            request.setEntity(new StringEntity(requestBody, ContentType.APPLICATION_JSON));

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
