package com.saucelabs.visual.graphql;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
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
  void buildIn_defaultsCustomIdToNull() {
    CreateBuildMutation.BuildIn buildIn =
        new CreateBuildMutation.BuildIn("buildName", "projectName", "branchName", "mainBranch");

    assertNull(buildIn.getCustomId());
  }

  @Test
  void buildIn_storesCustomIdWhenProvided() {
    CreateBuildMutation.BuildIn buildIn =
        new CreateBuildMutation.BuildIn(
            "buildName", "projectName", "branchName", "mainBranch", "my-custom-id");

    assertEquals("my-custom-id", buildIn.getCustomId());
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
