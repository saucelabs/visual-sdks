package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.Diff;
import com.saucelabs.visual.graphql.type.DiffsConnection;
import java.util.List;
import java.util.stream.Collectors;

public class SnapshotDiffResult {
  public String id;

  public String uploadId;

  public List<String> diffIds;

  @JsonCreator
  public SnapshotDiffResult(
      @JsonProperty("id") String id,
      @JsonProperty("uploadId") String uploadId,
      @JsonProperty("diffs") DiffsConnection diffs) {
    this.id = id;
    this.uploadId = uploadId;
    this.diffIds = diffs.getNodes().stream().map(Diff::getId).collect(Collectors.toList());
  }

  @Override
  public String toString() {
    return "SnapshotDiffResult.Result{"
        + "id='"
        + id
        + '\''
        + ", uploadId='"
        + uploadId
        + '\''
        + ", diffs="
        + diffIds
        + '}';
  }
}
