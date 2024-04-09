package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.BuildMode;
import java.util.Collections;
import java.util.Map;

public class BuildByCustomIdQuery implements GraphQLOperation {

  public static final String OPERATION_DOCUMENT =
      "query buildByCustomId($input: String!) {\n"
          + "  result: buildByCustomId(customId: $input) {\n"
          + "    id\n"
          + "    name\n"
          + "    project\n"
          + "    branch\n"
          + "    defaultBranch\n"
          + "    url\n"
          + "    mode\n"
          + "  }\n"
          + "}\n";

  public static class Data {

    public final BuildByCustomIdQuery.Result result;

    @JsonCreator
    public Data(@JsonProperty("result") BuildByCustomIdQuery.Result result) {
      this.result = result;
    }

    @Override
    public String toString() {
      return "BuildByCustomIdQuery.Data{" + "result=" + result + '}';
    }
  }

  public static class Result {

    public String id;
    public String name;
    public String project;
    public String branch;
    public String defaultBranch;
    public String url;
    public BuildMode mode;

    @JsonCreator
    public Result(
        @JsonProperty("id") String id,
        @JsonProperty("name") String name,
        @JsonProperty("project") String project,
        @JsonProperty("branch") String branch,
        @JsonProperty("defaultBranch") String defaultBranch,
        @JsonProperty("url") String url,
        @JsonProperty("status") BuildMode mode) {
      this.id = id;
      this.name = name;
      this.project = project;
      this.branch = branch;
      this.defaultBranch = defaultBranch;
      this.url = url;
      this.mode = mode;
    }

    @Override
    public String toString() {
      return "BuildByCustomIdQuery.Result{"
          + "id='"
          + id
          + '\''
          + ", name='"
          + name
          + '\''
          + ", project='"
          + project
          + '\''
          + ", branch='"
          + branch
          + '\''
          + ", defaultBranch='"
          + defaultBranch
          + '\''
          + ", url='"
          + url
          + '\''
          + ", mode="
          + mode
          + '}';
    }
  }

  private final String input;

  public BuildByCustomIdQuery(String customId) {
    this.input = customId;
  }

  @Override
  public String getQuery() {
    return OPERATION_DOCUMENT;
  }

  @Override
  public Map<String, Object> getVariables() {
    return Collections.singletonMap("input", input);
  }
}
