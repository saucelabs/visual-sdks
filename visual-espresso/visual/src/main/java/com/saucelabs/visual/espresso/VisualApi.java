package com.saucelabs.visual.espresso;

import android.util.Log;

import com.saucelabs.visual.espresso.VisualBuild.BuildAttributes;
import com.saucelabs.visual.espresso.graphql.GraphQLClient;
import com.saucelabs.visual.espresso.type.BuildIn;
import com.saucelabs.visual.espresso.type.FinishBuildIn;
import com.saucelabs.visual.espresso.type.SnapshotIn;
import com.saucelabs.visual.espresso.type.SnapshotUploadIn;
import com.saucelabs.visual.espresso.utils.ScreenshotHelper;

public class VisualApi {
    private final static String LOG_TAG = VisualApi.class.getSimpleName();

    private final GraphQLClient graphQLClient;

    public VisualApi(GraphQLClient graphQLClient) {
        this.graphQLClient = graphQLClient;
    }

    VisualBuild createBuild(BuildAttributes buildAttributes) {
        BuildIn input = BuildIn.builder()
                .name(buildAttributes.name)
                .branch(buildAttributes.branch)
                .project(buildAttributes.project)
                .defaultBranch(buildAttributes.defaultBranch)
                .build();
        CreateBuildMutation m = CreateBuildMutation.builder().input(input).build();
        CreateBuildMutation.Data d = graphQLClient.executeMutation(m);
        Log.i(LOG_TAG, String.format(" %n   Sauce Visual: %n%85s%n ", d.result.url));
        return new VisualBuild(d);
    }

    CreateSnapshotUploadMutation.Data uploadSnapshot(String buildId) {
        SnapshotUploadIn input = SnapshotUploadIn.builder().buildUuid(buildId).build();
        CreateSnapshotUploadMutation m = CreateSnapshotUploadMutation.builder().input(input).build();
        CreateSnapshotUploadMutation.Data d = graphQLClient.executeMutation(m);
        byte[] screenshot = ScreenshotHelper.getInstance().getScreenshot();
        ScreenshotHelper.getInstance().uploadToUrl(d.result.imageUploadUrl, screenshot);
        return d;
    }

    void createSnapshot(SnapshotIn snapshotIn) {
        CreateSnapshotMutation m = new CreateSnapshotMutation(snapshotIn);
        graphQLClient.executeMutation(m);
    }

    void finishBuild(String buildId) {
        FinishBuildIn input = FinishBuildIn.builder().uuid(buildId).build();
        FinishBuildMutation m = new FinishBuildMutation(input);
        graphQLClient.executeMutation(m);
    }
}
