package com.saucelabs.visual.espresso;

import android.util.Log;

import com.saucelabs.visual.espresso.VisualBuild.BuildAttributes;
import com.saucelabs.visual.espresso.graphql.GraphQLClient;
import com.saucelabs.visual.espresso.graphql.mutation.CreateSnapshotMutation;
import com.saucelabs.visual.espresso.graphql.mutation.CreateSnapshotUploadMutation;
import com.saucelabs.visual.espresso.utils.ScreenshotHelper;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.CreateBuildMutation;
import com.saucelabs.visual.graphql.FinishBuildMutation;

import java.io.IOException;

public class VisualApi {
    private final static String LOG_TAG = VisualApi.class.getSimpleName();

    private final GraphQLClient graphQLClient;

    public VisualApi(GraphQLClient graphQLClient) {
        this.graphQLClient = graphQLClient;
    }

    protected VisualBuild createBuild(BuildAttributes buildAttributes) {
        CreateBuildMutation mutation =
                new CreateBuildMutation(
                        new CreateBuildMutation.BuildIn(
                                buildAttributes.name,
                                buildAttributes.project,
                                buildAttributes.branch,
                                buildAttributes.defaultBranch));
        CreateBuildMutation.Data data = graphQLClient.execute(mutation, CreateBuildMutation.Data.class);
        Log.i(LOG_TAG, String.format(" %n   Sauce Visual: %n%85s%n ", data.result.url));
        return new VisualBuild(
                data.result.id,
                data.result.name,
                data.result.project,
                data.result.branch,
                data.result.defaultBranch,
                data.result.url);
    }

    CreateSnapshotUploadMutation.Data uploadSnapshot(String buildId) {
        CreateSnapshotUploadMutation mutation = new CreateSnapshotUploadMutation(new CreateSnapshotUploadMutation.CreateSnapshotUploadIn(buildId));
        CreateSnapshotUploadMutation.Data data = graphQLClient.execute(mutation, CreateSnapshotUploadMutation.Data.class);
        try {
            byte[] screenshot = ScreenshotHelper.getInstance().getScreenshot();
            ScreenshotHelper.getInstance().uploadToUrl(data.result.imageUploadUrl, screenshot);
        } catch (IOException e) {
            throw new VisualApiException("uploadSnapshot failed");
        }
        return data;
    }

    void createSnapshot(CreateSnapshotMutation.SnapshotIn snapshotIn) {
        CreateSnapshotMutation mutation = new CreateSnapshotMutation(snapshotIn);
        graphQLClient.execute(mutation, CreateSnapshotMutation.Data.class);
    }

    void finishBuild(String buildId) {
        FinishBuildMutation mutation =
                new FinishBuildMutation(new FinishBuildMutation.FinishBuildIn(buildId));
        graphQLClient.execute(mutation, FinishBuildMutation.Data.class);
    }

}
