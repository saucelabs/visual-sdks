package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.Snapshot;
import com.saucelabs.visual.graphql.type.SnapshotIn;
import java.util.Collections;
import java.util.Map;

public class CreateSnapshotMutation implements GraphQLOperation {
  SnapshotIn input;

  @Override
  public String getQuery() {
    return "mutation createSnapshot($input: SnapshotIn!) { result: createSnapshot(input: $input) { __typename id } }";
  }

  public CreateSnapshotMutation(SnapshotIn snapshotIn) {
    this.input = snapshotIn;
  }

  @Override
  public Map<String, Object> getVariables() {
    return Collections.singletonMap("input", input);
  }

  public static class Data {
    public final Snapshot result;

    public Data(@JsonProperty("result") Snapshot result) {
      this.result = result;
    }
  }
}
