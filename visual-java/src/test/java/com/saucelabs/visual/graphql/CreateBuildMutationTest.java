package com.saucelabs.visual.graphql;

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
