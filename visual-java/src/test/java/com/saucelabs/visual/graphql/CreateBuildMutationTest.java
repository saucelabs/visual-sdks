package com.saucelabs.visual.graphql;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Arrays;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class CreateBuildMutationTest {

  @Test
  void testSerialization() throws IOException {
    ObjectMapper mapper = new ObjectMapper();
    String json =
        mapper.writeValueAsString(
            new CreateBuildMutation(
                new CreateBuildMutation.BuildIn(
                    "buildName", "projectName", "branchName", "defaultBranchName")));
  }

  @Test
  void testSerializationWithTags() throws IOException {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode input =
        mapper
            .valueToTree(
                new CreateBuildMutation(
                    new CreateBuildMutation.BuildIn(
                        "buildName",
                        "projectName",
                        "branchName",
                        "defaultBranchName",
                        Arrays.asList("smoke", "nightly"))))
            .get("variables")
            .get("input");
    assertEquals("[\"smoke\",\"nightly\"]", input.get("tags").toString());

    JsonNode withoutTags =
        mapper
            .valueToTree(
                new CreateBuildMutation(
                    new CreateBuildMutation.BuildIn(
                        "buildName", "projectName", "branchName", "defaultBranchName")))
            .get("variables")
            .get("input");
    assertTrue(withoutTags.get("tags").isNull());
  }

  @Test
  @Disabled
  void executeRequest() {
    GraphQLClient client =
        new GraphQLClient(
            "https://api.us-west-1.saucelabs.com/v1/visual/graphql", "username", "access-key");
    CreateBuildMutation.Data data =
        client.execute(
            new CreateBuildMutation(
                new CreateBuildMutation.BuildIn(
                    "buildName", "projectName", "branchName", "defaultBranchName")),
            CreateBuildMutation.Data.class);
  }
}
