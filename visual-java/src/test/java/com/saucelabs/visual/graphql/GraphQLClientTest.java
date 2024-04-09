package com.saucelabs.visual.graphql;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.saucelabs.visual.utils.ArtifactVersion;
import java.io.IOException;
import org.apache.http.HttpResponse;
import org.apache.http.ProtocolVersion;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.message.BasicStatusLine;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

public class GraphQLClientTest {

  @Test
  public void testProperRequestHeaders() throws IOException {
    BuildQuery operation = new BuildQuery("ed1b3f79-e88b-4a8c-9494-2a98e6a6f24f");

    HttpResponse httpResponse = mock(HttpResponse.class);

    when(httpResponse.getStatusLine())
        .thenReturn(new BasicStatusLine(new ProtocolVersion("HTTP", 1, 1), 200, "OK"));
    when(httpResponse.getEntity())
        .thenReturn(
            new StringEntity(
                ""
                    + "{"
                    + "  \"data\": {"
                    + "    \"build\": {"
                    + "      \"name\": \"SauceDemo - Java\""
                    + "    }"
                    + "  }"
                    + "}"));

    HttpClient httpClient = mock(HttpClient.class);
    when(httpClient.execute(any())).thenReturn(httpResponse);

    GraphQLClient client = new GraphQLClient(httpClient, "http://dummy", "username", "access-key");
    client.execute(operation, BuildQuery.Result.class);

    ArgumentCaptor<HttpPost> httpRequestCaptor = ArgumentCaptor.forClass(HttpPost.class);
    verify(httpClient).execute(httpRequestCaptor.capture());

    HttpPost post = httpRequestCaptor.getValue();
    Assertions.assertEquals("application/json", post.getHeaders("Content-Type")[0].getValue());
    Assertions.assertEquals("application/json", post.getHeaders("Accept")[0].getValue());
    Assertions.assertEquals(
        "Basic dXNlcm5hbWU6YWNjZXNzLWtleQ==", post.getHeaders("Authorization")[0].getValue());
    Assertions.assertEquals(
        post.getHeaders("User-Agent")[0].getValue(),
        "sauce-visual-java/" + ArtifactVersion.getArtifactVersion().get());
  }
}
