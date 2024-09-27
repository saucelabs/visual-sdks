package com.saucelabs.visual.espresso;

import android.util.Log;

import com.saucelabs.visual.espresso.VisualBuild.BuildAttributes;
import com.saucelabs.visual.espresso.exception.VisualApiException;
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

    protected VisualBuild createBuild(BuildAttributes buildAttributes) {
        BuildIn input = BuildIn.builder()
                .name(buildAttributes.name)
                .branch(buildAttributes.branch)
                .project(buildAttributes.project)
                .defaultBranch(buildAttributes.defaultBranch)
                .build();
        CreateBuildMutation m = CreateBuildMutation.builder().input(input).build();
        try {
            CreateBuildMutation.Data d = graphQLClient.executeMutation(m).get();
            Log.i(LOG_TAG, String.format(" %n   Sauce Visual: %n%85s%n ", d.result.url));
            return new VisualBuild(d);
        } catch (Exception e) {
            throw new VisualApiException("yolo");
        }
    }

    CreateSnapshotUploadMutation.Data uploadSnapshot(String buildId) {
        CreateSnapshotUploadMutation m = CreateSnapshotUploadMutation.builder().input(
                SnapshotUploadIn.builder().buildUuid(buildId).build()).build();
        try {
            CreateSnapshotUploadMutation.Data d = graphQLClient.executeMutation(m).get();
            byte[] screenshot = ScreenshotHelper.getInstance().getScreenshot();
            ScreenshotHelper.getInstance().uploadToUrl(d.result.imageUploadUrl, screenshot);
            return d;
        } catch (Exception e) {
            throw new VisualApiException("yolo");
        }
    }

    void createSnapshot(SnapshotIn snapshotIn) {
        CreateSnapshotMutation m = new CreateSnapshotMutation(snapshotIn);
        graphQLClient.executeMutation(m);
    }

    void finishBuild(String buildId) {
        FinishBuildMutation m = new FinishBuildMutation(FinishBuildIn.builder().uuid(buildId).build());
        graphQLClient.executeMutation(m);
    }
}
