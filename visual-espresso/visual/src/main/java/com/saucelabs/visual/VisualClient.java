package com.saucelabs.visual;

import com.saucelabs.visual.VisualBuild.BuildAttributes;
import com.saucelabs.visual.graphql.GraphQLClient;
import com.saucelabs.visual.graphql.mutation.CreateSnapshotMutation;
import com.saucelabs.visual.graphql.mutation.CreateSnapshotUploadMutation;
import com.saucelabs.visual.model.OperatingSystem;

public class VisualClient {

    private final VisualBuild build;
    private final VisualApi visualApi;

    public VisualClient(String name) {
        this(new VisualApi(new GraphQLClient()), new BuildAttributes(name, null, null, null));
    }

    public VisualClient(BuildAttributes buildAttributes) {
        this(new VisualApi(new GraphQLClient()), buildAttributes);
    }

    private VisualClient(VisualApi visualApi, BuildAttributes buildAttributes) {
        this(visualApi, VisualBuild.getBuildOnce(visualApi, buildAttributes));
    }

    VisualClient(VisualApi visualApi, VisualBuild build) {
        this.visualApi = visualApi;
        this.build = build;
    }

    public void sauceVisualCheck(String snapshotName) {
        this.sauceVisualCheck(snapshotName, new VisualCheckOptions());
    }

    public void sauceVisualCheck(String snapshotName, VisualCheckOptions options) {
        CreateSnapshotUploadMutation.Data data = visualApi.uploadSnapshot(this.build.getId());
        CreateSnapshotMutation.SnapshotIn input = new CreateSnapshotMutation.SnapshotIn(
                this.build.getId(), data.result.id, snapshotName, options.resolveTestName(), options.resolveSuiteName(), OperatingSystem.ANDROID, "");
        visualApi.createSnapshot(input);
    }

    public void finish() {
        visualApi.finishBuild(this.build.getId());
    }
}
