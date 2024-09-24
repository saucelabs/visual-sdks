package com.saucelabs.visual.espresso.graphql.mutation;

import androidx.annotation.NonNull;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.saucelabs.visual.espresso.model.OperatingSystem;
import com.saucelabs.visual.graphql.GraphQLOperation;

import java.util.Collections;
import java.util.Map;

public class CreateSnapshotMutation implements GraphQLOperation {

    public static final String OPERATION_DOCUMENT =
            "mutation createSnapshot($input: SnapshotIn!) { result: createSnapshot(input: $input) { id uploadId } }";

    private final SnapshotIn input;

    public CreateSnapshotMutation(SnapshotIn input) {
        this.input = input;
    }

    public static class SnapshotIn {
        private final String buildUuid;
        private final String uploadUuid;
        private final String name;
        private final String testName;
        private final String suiteName;
        private final OperatingSystem operatingSystem;
        private final String operatingSystemVersion;

        public SnapshotIn(
                String buildUuid,
                String uploadUuid,
                String name,
                String testName,
                String suiteName,
                OperatingSystem operatingSystem,
                String operatingSystemVersion) {
            this.buildUuid = buildUuid;
            this.uploadUuid = uploadUuid;
            this.name = name;
            this.testName = testName;
            this.suiteName = suiteName;
            this.operatingSystem = operatingSystem;
            this.operatingSystemVersion = operatingSystemVersion;
        }

        public String getBuildUuid() {
            return buildUuid;
        }

        public String getUploadUuid() {
            return uploadUuid;
        }

        public String getName() {
            return name;
        }

        public String getSuiteName() {
            return suiteName;
        }

        public String getTestName() {
            return testName;
        }

        public OperatingSystem getOperatingSystem() {
            return operatingSystem;
        }

        public String getOperatingSystemVersion() {
            return operatingSystemVersion;
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
            return "CreateSnapshotMutation.Data{" + "result=" + result + '}';
        }
    }

    public static class Result {
        public final String id;
        public final String uploadId;

        public Result(
                @JsonProperty("id") String id,
                @JsonProperty("uploadId") String uploadId) {
            this.id = id;
            this.uploadId = uploadId;
        }

        @NonNull
        @Override
        public String toString() {
            return "Result{" +
                    "id='" + id + '\'' +
                    ", uploadId='" + uploadId + '\'' +
                    '}';
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
