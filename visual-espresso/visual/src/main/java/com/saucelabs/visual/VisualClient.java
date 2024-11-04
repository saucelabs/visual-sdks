package com.saucelabs.visual;

import android.os.Build;

import com.saucelabs.visual.VisualBuild.BuildAttributes;
import com.saucelabs.visual.graphql.CreateSnapshotMutation;
import com.saucelabs.visual.graphql.CreateSnapshotUploadMutation;
import com.saucelabs.visual.graphql.GraphQLClient;
import com.saucelabs.visual.graphql.type.OperatingSystem;
import com.saucelabs.visual.graphql.type.SnapshotIn;

public class VisualClient {

    private final VisualBuild build;
    private final VisualApi visualApi;
    private Boolean captureDom;

    VisualClient(VisualApi visualApi, VisualBuild build) {
        this.visualApi = visualApi;
        this.build = build;
    }

    private VisualClient(VisualApi visualApi, BuildAttributes buildAttributes, String customId, String buildId) {
        this(visualApi, VisualBuild.getBuildOnce(visualApi, buildAttributes, customId, buildId));
    }

    public static final class Builder {
        private final String region;
        private final String username;
        private final String accessKey;
        private String buildName;
        private String projectName;
        private String branchName;
        private String defaultBranchName;
        private Boolean captureDom;
        private String customId;
        private String buildId;

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
        public Builder buildName(String buildName) {
            this.buildName = buildName;
            return this;
        }

        /**
         * @param projectName The label / project you would like to associate this build with.
         * @return Builder instance
         */
        public Builder projectName(String projectName) {
            this.projectName = projectName;
            return this;
        }

        /**
         * @param branchName The branch name you would like to associate this build with.
         *                   We recommend using your current VCS branch in CI.
         * @return Builder instance
         */
        public Builder branchName(String branchName) {
            this.branchName = branchName;
            return this;
        }

        /**
         * @param defaultBranchName The main branch name you would like to associate this build with.
         *                          Usually <code>main</code> or <code>master</code> or alternatively the branch name your current branch was derived from.
         * @return Builder instance
         */
        public Builder defaultBranchName(String defaultBranchName) {
            this.defaultBranchName = defaultBranchName;
            return this;
        }

        /**
         * @param captureDom Toggle DOM capturing for the whole build
         * @return Builder instance
         */
        public Builder captureDom(Boolean captureDom) {
            this.captureDom = captureDom;
            return this;
        }

        /**
         * @param customId For advanced users, a user-supplied custom ID to identify this build.
         * @return Builder instance
         */
        public Builder customId(String customId) {
            this.customId = customId;
            return this;
        }

        /**
         * @param buildId For advanced users, a user-supplied Sauce Labs Visual build ID.
         * @return Builder instance
         */
        public Builder buildId(String buildId) {
            this.buildId = buildId;
            return this;
        }

        public VisualClient build() {
            GraphQLClient graphQLClient = new GraphQLClient(DataCenter.fromSauceRegion(region), username, accessKey);
            VisualApi visualApi = new VisualApi(graphQLClient);
            BuildAttributes buildAttributes = new BuildAttributes(buildName, projectName, branchName, defaultBranchName);
            VisualClient client = new VisualClient(visualApi, buildAttributes, customId, buildId);
            client.setCaptureDom(this.captureDom);
            return client;
        }
    }

    private void setCaptureDom(Boolean captureDom) {
        this.captureDom = captureDom;
    }

    /**
     * Convenience methods for creating new builder instances
     */
    public static Builder builder(String username, String accessKey) {
        return new Builder(username, accessKey);
    }

    public static Builder builder(String region, String username, String accessKey) {
        return new Builder(region, username, accessKey);
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
        Boolean captureDom = options.getCaptureDom() != null ? options.getCaptureDom() : this.captureDom;
        CreateSnapshotUploadMutation.Data data = visualApi.uploadSnapshot(
                this.build.getId(),
                captureDom == Boolean.TRUE,
                options.getClipElement()
        );
        SnapshotIn input = SnapshotIn.builder()
                .buildUuid(this.build.getId())
                .uploadUuid(data.result.id)
                .name(snapshotName)
                .testName(options.resolveTestName())
                .suiteName(options.resolveSuiteName())
                .operatingSystem(OperatingSystem.ANDROID)
                .operatingSystemVersion(Build.VERSION.RELEASE)
                .device(Build.MANUFACTURER + " " + Build.MODEL)
                .ignoreRegions(options.getIgnoreRegions())
                .diffingOptions(options.getDiffingOptions())
                .diffingMethod(options.getDiffingMethod())
                .build();
        return visualApi.createSnapshot(input);
    }

    /**
     * Finishes a VisualBuild. Should be called explicitly in @After/@AfterClass
     */
    public void finish() {
        visualApi.finishBuild(this.build.getId());
    }

}
