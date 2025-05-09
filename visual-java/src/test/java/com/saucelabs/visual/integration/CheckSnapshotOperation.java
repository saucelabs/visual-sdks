package com.saucelabs.visual.integration;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.saucelabs.visual.graphql.GraphQLOperation;
import com.saucelabs.visual.graphql.type.DiffStatus;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

class CheckSnapshotOperation implements GraphQLOperation {
  private final String snapshotId;

  public CheckSnapshotOperation(String snapshotId) {
    this.snapshotId = snapshotId;
  }

  @Override
  public String getQuery() {
    return "query GetSnapshot($snapshotId: UUID!) { snapshot(id: $snapshotId) { name suiteName testName operatingSystem operatingSystemVersion device devicePixelRatio hasDom diffs { nodes { status diffClusters { x y width height } } } ignoreRegions { x y width height } } }";
  }

  @Override
  public Map<String, Object> getVariables() {
    return Collections.singletonMap("snapshotId", snapshotId);
  }

  static class Result {
    String data;
    DiffStatus status;

    @JsonCreator
    Result(LinkedHashMap<String, LinkedHashMap> data) throws JsonProcessingException {
      this.data =
          new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT).writeValueAsString(data);
      status =
          DiffStatus.valueOf(
              new ObjectMapper()
                  .readTree(this.data)
                  .at("/snapshot/diffs/nodes/0")
                  .get("status")
                  .textValue());
    }
  }
}
