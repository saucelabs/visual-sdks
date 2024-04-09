package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.BuildStatus;
import java.util.Collections;
import java.util.Map;

public class CreateBuildMutation implements GraphQLOperation {

  /**
   * The minimized GraphQL document being sent to the server to save a few bytes. The un-minimized
   * version is:
   *
   * <p>mutation createBuild($input: BuildIn!) { result: createBuild(input: $input) { id name
   * project branch defaultBranch status url } }
   */
  public static final String OPERATION_DOCUMENT =
      "mutation createBuild($input: BuildIn!) { result: createBuild(input: $input) { id name project branch defaultBranch status url } }";

  public static class BuildIn {
    private final String name;
    private final String project;
    private final String branch;
    private final String defaultBranch;

    public BuildIn(String name, String project, String branch, String defaultBranch) {
      this.name = name;
      this.project = project;
      this.branch = branch;
      this.defaultBranch = defaultBranch;
    }

    public String getName() {
      return name;
    }

    public String getProject() {
      return project;
    }

    public String getBranch() {
      return branch;
    }

    public String getDefaultBranch() {
      return defaultBranch;
    }
  }

  public static class Data {

    public final Result result;

    @JsonCreator
    public Data(@JsonProperty("result") Result result) {
      this.result = result;
    }

    @Override
    public String toString() {
      return "CreateBuildMutation.Data{" + "result=" + result + '}';
    }
  }

  public static class Result {

    public String id;

    public String name;

    public String project;
    public String branch;
    public String defaultBranch;

    public BuildStatus status;

    public String url;

    @JsonCreator
    public Result(
        @JsonProperty("id") String id,
        @JsonProperty("name") String name,
        @JsonProperty("project") String project,
        @JsonProperty("branch") String branch,
        @JsonProperty("defaultBranch") String defaultBranch,
        @JsonProperty("status") BuildStatus status,
        @JsonProperty("url") String url) {
      this.id = id;
      this.name = name;
      this.project = project;
      this.branch = branch;
      this.defaultBranch = defaultBranch;
      this.status = status;
      this.url = url;
    }

    @Override
    public String toString() {
      return "CreateBuildMutation.Result{"
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
          + ", status="
          + status
          + ", url='"
          + url
          + '\''
          + '}';
    }
  }

  private final BuildIn input;

  public CreateBuildMutation(BuildIn input) {
    this.input = input;
  }

  public Map<String, Object> getVariables() {
    return Collections.singletonMap("input", input);
  }

  public String getQuery() {
    return OPERATION_DOCUMENT;
  }
}
