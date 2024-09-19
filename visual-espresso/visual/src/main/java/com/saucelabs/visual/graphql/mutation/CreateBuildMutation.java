package com.saucelabs.visual.graphql.mutation;

import androidx.annotation.NonNull;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.GraphQLOperation;
import com.saucelabs.visual.model.BuildMode;

import java.util.Collections;
import java.util.Map;

public class CreateBuildMutation implements GraphQLOperation {

    public static final String OPERATION_DOCUMENT =
            "mutation createBuild($input: BuildIn!) { result: createBuild(input: $input) { id name url mode project branch defaultBranch } }";

    private final BuildIn input;

    public CreateBuildMutation(BuildIn input) {
        this.input = input;
    }

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

        public final String id;
        public final String name;
        public final String url;
        public final BuildMode mode;
        public final String project;
        public final String branch;
        public final String defaultBranch;

        @JsonCreator
        public Result(
                @JsonProperty("id") String id,
                @JsonProperty("name") String name,
                @JsonProperty("url") String url,
                @JsonProperty("mode") BuildMode mode,
                @JsonProperty("project") String project,
                @JsonProperty("branch") String branch,
                @JsonProperty("defaultBranch") String defaultBranch) {
            this.id = id;
            this.name = name;
            this.project = project;
            this.branch = branch;
            this.defaultBranch = defaultBranch;
            this.mode = mode;
            this.url = url;
        }

        @NonNull
        @Override
        public String toString() {
            return "CreateBuildMutation.Result{"
                    + "id='"
                    + id
                    + '\''
                    + ", name='"
                    + name
                    + '\''
                    + ", url='"
                    + url
                    + '\''
                    + ", mode="
                    + mode
                    + ", project='"
                    + project
                    + '\''
                    + ", branch='"
                    + branch
                    + '\''
                    + ", defaultBranch='"
                    + defaultBranch
                    + '\''
                    + '}';
        }
    }

    @Override
    public Map<String, Object> getVariables() {
        return Collections.singletonMap("input", input);
    }

    @Override
    public String getQuery() {
        return OPERATION_DOCUMENT;
    }
}
