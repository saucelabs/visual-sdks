package com.saucelabs.visual.espresso.graphql.mutation;

import androidx.annotation.NonNull;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.graphql.GraphQLOperation;

import java.util.Collections;
import java.util.Map;

public class CreateSnapshotUploadMutation implements GraphQLOperation {

    public static final String OPERATION_DOCUMENT =
            "mutation createSnapshotUpload($input: SnapshotUploadIn!) { result: createSnapshotUpload(input: $input) { id imageUploadUrl domUploadUrl } }";

    private final CreateSnapshotUploadIn input;

    public CreateSnapshotUploadMutation(CreateSnapshotUploadIn input) {
        this.input = input;
    }

    public static class CreateSnapshotUploadIn {

        public final String buildUuid;

        public CreateSnapshotUploadIn(String buildUuid) {
            this.buildUuid = buildUuid;
        }
    }

    public static class Data {

        public final Result result;

        @JsonCreator
        public Data(@JsonProperty("result") Result result) {
            this.result = result;
        }

        @NonNull
        @Override
        public String toString() {
            return "CreateSnapshotUploadMutation.Data{" + "result=" + result + '}';
        }
    }

    public static class Result {
        public final String id;
        public final String imageUploadUrl;
        public final String domUploadUrl;

        public Result(
                @JsonProperty("id") String id,
                @JsonProperty("imageUploadUrl") String imageUploadUrl,
                @JsonProperty("domUploadUrl") String domUploadUrl) {
            this.id = id;
            this.imageUploadUrl = imageUploadUrl;
            this.domUploadUrl = domUploadUrl;
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
