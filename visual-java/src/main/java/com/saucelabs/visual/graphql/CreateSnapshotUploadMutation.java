package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.SnapshotUpload;
import com.saucelabs.visual.graphql.type.SnapshotUploadIn;
import java.util.Collections;
import java.util.Map;

public class CreateSnapshotUploadMutation implements GraphQLOperation {
  SnapshotUploadIn input;

  @Override
  public String getQuery() {
    return "mutation createSnapshotUpload($input: SnapshotUploadIn!) { result: createSnapshotUpload(input: $input) { id buildId imageUploadUrl domUploadUrl } }";
  }

  public CreateSnapshotUploadMutation(SnapshotUploadIn snapshotUploadIn) {
    this.input = snapshotUploadIn;
  }

  @Override
  public Map<String, Object> getVariables() {
    return Collections.singletonMap("input", input);
  }

  public static class Data {
    public final SnapshotUpload result;

    public Data(@JsonProperty("result") SnapshotUpload result) {
      this.result = result;
    }
  }
}
