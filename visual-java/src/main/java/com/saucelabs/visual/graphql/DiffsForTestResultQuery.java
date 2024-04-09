package com.saucelabs.visual.graphql;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.type.DiffStatus;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class DiffsForTestResultQuery implements GraphQLOperation {

  /**
   * The minimized GraphQL document being sent to the server to save a few bytes. The un-minimized
   * version is:
   *
   * <p>query diffsForTestResult($input: UUID!) { result: diffs(condition: { buildId: $input } ) {
   * nodes { id status } } }
   */
  public static final String OPERATION_DOCUMENT =
      "query diffsForTestResult($input: UUID!) { result: diffs(condition: { buildId: $input } ) { nodes { id status } } }";

  public static class Data {

    public final Result result;

    @JsonCreator
    public Data(@JsonProperty("result") Result result) {
      this.result = result;
    }

    @Override
    public String toString() {
      return "DiffsForTestResultQuery.Data{" + "result=" + result + '}';
    }
  }

  public static class Result {
    /** A list of `Diff` objects. */
    public List<Node> nodes;

    @JsonCreator
    public Result(@JsonProperty("nodes") List<Node> nodes) {
      this.nodes = nodes;
    }

    @Override
    public String toString() {
      return "DiffsForTestResultQuery.Result{" + "nodes=" + nodes + '}';
    }
  }

  public static class Node {
    public String id;

    public DiffStatus status;

    @JsonCreator
    public Node(@JsonProperty("id") String id, @JsonProperty("status") DiffStatus status) {
      this.id = id;
      this.status = status;
    }

    @Override
    public String toString() {
      return "DiffsForTestResultQuery.Node{" + "id='" + id + '\'' + ", status=" + status + '}';
    }
  }

  private final String input;

  public DiffsForTestResultQuery(String input) {
    this.input = input;
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
