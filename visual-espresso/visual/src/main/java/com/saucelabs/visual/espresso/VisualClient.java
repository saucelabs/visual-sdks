package com.saucelabs.visual.espresso;

import android.os.Build;

import com.saucelabs.visual.espresso.VisualBuild.BuildAttributes;
import com.saucelabs.visual.espresso.graphql.GraphQLClient;
import com.saucelabs.visual.espresso.type.OperatingSystem;
import com.saucelabs.visual.espresso.type.SnapshotIn;

import java.util.Optional;

public class VisualClient {

    private final VisualBuild build;
    private final VisualApi visualApi;
    private Boolean captureDom;

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
        private Boolean captureDom;

        public Builder(String username, String accessKey) {
            this("us-west-1", username, accessKey);
        }

        public Builder(String region, String username, String accessKey) {
            this.region = region;
            this.username = username;
            this.accessKey = accessKey;
        }

        /**
         * @param buildName The build name you would like to appear in the Sauce Visual dashboard.
         * @return Builder instance
         */
        public Builder withBuildName(String buildName) {
            this.buildName = buildName;
            return this;
        }

        /**
         * @param projectName The label / project you would like to associate this build with.
         * @return Builder instance
         */
        public Builder withProjectName(String projectName) {
            this.projectName = projectName;
            return this;
        }

        /**
         * @param branchName The branch name you would like to associate this build with.
         *                   We recommend using your current VCS branch in CI.
         * @return Builder instance
         */
        public Builder withBranchName(String branchName) {
            this.branchName = branchName;
            return this;
        }

        /**
         * @param defaultBranchName The main branch name you would like to associate this build with.
         *                          Usually <code>main</code> or <code>master</code> or alternatively the branch name your current branch was derived from.
         * @return Builder instance
         */
        public Builder withDefaultBranchName(String defaultBranchName) {
            this.defaultBranchName = defaultBranchName;
            return this;
        }

        public Builder enableCaptureDom() {
            this.captureDom = true;
            return this;
        }

        public VisualClient build() {
            GraphQLClient graphQLClient = new GraphQLClient(DataCenter.fromSauceRegion(region), username, accessKey);
            VisualApi visualApi = new VisualApi(graphQLClient);
            BuildAttributes buildAttributes = new BuildAttributes(buildName, projectName, branchName, defaultBranchName);
            VisualClient client = new VisualClient(visualApi, buildAttributes);
            client.setCaptureDom(this.captureDom);
            return client;
        }
    }

    /**
     * Uploads and creates a snapshot with a given name and default options
     *
     * @param snapshotName A name for the snapshot
     */
    public CreateSnapshotMutation.Data sauceVisualCheck(String snapshotName) {
        return this.sauceVisualCheck(snapshotName, new VisualCheckOptions.Builder().build());
    }

    /**
     * Uploads and creates a snapshot with a given snapshotName and options
     *
     * @param snapshotName A name for the snapshot
     * @param options      Options for the VisualCheck
     */
    public CreateSnapshotMutation.Data sauceVisualCheck(String snapshotName, VisualCheckOptions options) {
        Boolean captureDom = Optional.ofNullable(options.getCaptureDom()).orElse(this.captureDom);
        CreateSnapshotUploadMutation.Data data = visualApi.uploadSnapshot(this.build.getId(), captureDom);
        SnapshotIn input = SnapshotIn.builder()
                .buildUuid(this.build.getId())
                .uploadUuid(data.result.id)
                .name(snapshotName)
                .testName(options.resolveTestName())
                .suiteName(options.resolveSuiteName())
                .operatingSystem(OperatingSystem.ANDROID)
                .operatingSystemVersion(Build.VERSION.RELEASE)
                .device(Build.MODEL)
                .ignoreRegions(options.getIgnoreRegions())
                .build();
        return visualApi.createSnapshot(input);
    }

    /**
     * Finishes a VisualBuild. Should be called explicitly in @AfterClass in your tests.
     */
    public void finish() {
        visualApi.finishBuild(this.build.getId());
    }

    private void setCaptureDom(Boolean captureDom) {
        this.captureDom = captureDom;
    }
}
