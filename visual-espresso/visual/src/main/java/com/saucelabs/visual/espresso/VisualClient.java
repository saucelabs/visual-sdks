package com.saucelabs.visual.espresso;

import com.saucelabs.visual.espresso.graphql.GraphQLClient;
import com.saucelabs.visual.espresso.model.DataCenter;
import com.saucelabs.visual.espresso.graphql.mutation.CreateSnapshotUploadMutation;
import com.saucelabs.visual.espresso.graphql.mutation.CreateSnapshotMutation;
import com.saucelabs.visual.espresso.model.OperatingSystem;
import com.saucelabs.visual.espresso.VisualBuild.BuildAttributes;

public class VisualClient {

    private final com.saucelabs.visual.espresso.VisualBuild build;
    private final com.saucelabs.visual.espresso.VisualApi visualApi;

    VisualClient(VisualApi visualApi, VisualBuild build) {
        this.visualApi = visualApi;
        this.build = build;
    }

    private VisualClient(VisualApi visualApi, BuildAttributes buildAttributes) {
        this(visualApi, VisualBuild.getBuildOnce(visualApi, buildAttributes));
    }

    public static class Builder {
        private final String region;
        private final String username;
        private final String accessKey;
        private String buildName;
        private String projectName;
        private String branchName;
        private String defaultBranchName;

        public Builder(String username, String accessKey) {
            this("us-west-1", username, accessKey);
        }

        public Builder(String region, String username, String accessKey) {
            this.region = region;
            this.username = username;
            this.accessKey = accessKey;
        }

        public Builder withBuildName(String buildName) {
            this.buildName = buildName;
            return this;
        }

        public Builder withProjectName(String projectName) {
            this.projectName = projectName;
            return this;
        }

        public Builder withBranchName(String branchName) {
            this.branchName = branchName;
            return this;
        }

        public Builder withDefaultBranchName(String defaultBranchName) {
            this.defaultBranchName = defaultBranchName;
            return this;
        }

        public VisualClient build() {
            GraphQLClient graphQLClient = new GraphQLClient(DataCenter.fromSauceRegion(region), username, accessKey);
            VisualApi visualApi = new VisualApi(graphQLClient);
            BuildAttributes buildAttributes = new BuildAttributes(buildName, projectName, branchName, defaultBranchName);
            return new VisualClient(visualApi, buildAttributes);
        }
    }

    public void sauceVisualCheck(String snapshotName) {
        this.sauceVisualCheck(snapshotName, new VisualCheckOptions());
    }

    public void sauceVisualCheck(String snapshotName, VisualCheckOptions options) {
        CreateSnapshotUploadMutation.Data data = visualApi.uploadSnapshot(this.build.getId());
        CreateSnapshotMutation.SnapshotIn input = new CreateSnapshotMutation.SnapshotIn(
                this.build.getId(),
                data.result.id,
                snapshotName,
                options.resolveTestName(),
                options.resolveSuiteName(),
                OperatingSystem.ANDROID,
                "");
        visualApi.createSnapshot(input);
    }

    public void finish() {
        visualApi.finishBuild(this.build.getId());
    }
}
