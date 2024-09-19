package com.saucelabs.visual.graphql.mutation;

import androidx.annotation.NonNull;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.GraphQLOperation;

import java.util.Collections;
import java.util.Map;

public class FinishBuildMutation implements GraphQLOperation {

    public static final String OPERATION_DOCUMENT =
            "mutation FinishBuild($input: FinishBuildIn!) { result: finishBuild(input: $input) { id name status url } }";

    private final FinishBuildIn input;

    public FinishBuildMutation(FinishBuildIn input) {
        this.input = input;
    }

    public static class FinishBuildIn {

        public final String uuid;

        public FinishBuildIn(String uuid) {
            this.uuid = uuid;
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
            return "FinishBuildMutation.Data{" + "result=" + result + '}';
        }
    }

    public static class Result {
        public final String id;
        public final String name;
        public final String status;
        public final String url;

        public Result(
                @JsonProperty("id") String id,
                @JsonProperty("name") String name,
                @JsonProperty("status") String status,
                @JsonProperty("url") String url) {
            this.id = id;
            this.name = name;
            this.status = status;
            this.url = url;
        }

        @NonNull
        @Override
        public String toString() {
            return "FinishBuildMutation.Result{"
                    + "id='"
                    + id
                    + '\''
                    + ", name='"
                    + name
                    + '\''
                    + ", status="
                    + status
                    + ", url='"
                    + url
                    + '\''
                    + '}';
        }
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
