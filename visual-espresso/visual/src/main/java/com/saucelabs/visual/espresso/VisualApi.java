package com.saucelabs.visual.espresso;

import android.util.Log;

import com.apollographql.apollo.api.Mutation;
import com.saucelabs.visual.espresso.VisualBuild.BuildAttributes;
import com.saucelabs.visual.espresso.exception.VisualApiException;
import com.saucelabs.visual.espresso.graphql.GraphQLClient;
import com.saucelabs.visual.espresso.type.BuildIn;
import com.saucelabs.visual.espresso.type.FinishBuildIn;
import com.saucelabs.visual.espresso.type.SnapshotIn;
import com.saucelabs.visual.espresso.type.SnapshotUploadIn;
import com.saucelabs.visual.espresso.utils.ScreenshotHelper;

import java.util.concurrent.CompletableFuture;

public class VisualApi {
    private final static String LOG_TAG = VisualApi.class.getSimpleName();

    private final GraphQLClient graphQLClient;

    public VisualApi(GraphQLClient graphQLClient) {
        this.graphQLClient = graphQLClient;
    }

    protected VisualBuild createBuild(BuildAttributes buildAttributes) {
        CreateBuildMutation mutation = CreateBuildMutation.builder().input(
                        BuildIn.builder()
                                .name(buildAttributes.name)
                                .branch(buildAttributes.branch)
                                .project(buildAttributes.project)
                                .defaultBranch(buildAttributes.defaultBranch)
                                .build())
                .build();
        try {
            CreateBuildMutation.Data d = executeQuery(mutation).get();
            Log.i(LOG_TAG, String.format(" %n   Sauce Visual: %n%85s%n ", d.result.url));
            return new VisualBuild(d.result.id.toString(), d.result.name, d.result.project, d.result.branch, d.result.defaultBranch, d.result.url);
        } catch (Exception e) {
            throw new VisualApiException("yolo");
        }
    }

    public <D extends Mutation.Data> CompletableFuture<D> executeQuery(Mutation<D> m) {
        CompletableFuture<D> future = new CompletableFuture<>();

        // Call enqueue() to execute a query asynchronously
        graphQLClient.get().mutation(m).enqueue(response -> {
            if (response.data != null) {
                // Complete the future with the data
                future.complete(response.data);
            } else {
                // Handle errors
                if (response.exception != null) {
                    // Complete the future exceptionally in case of non-GraphQL errors (e.g. network issues)
                    future.completeExceptionally(response.exception);
                } else {
                    // Complete the future with GraphQL error details
                }
            }
        });

        return future;
    }

    CreateSnapshotUploadMutation.Data uploadSnapshot(String buildId) {
        CreateSnapshotUploadMutation mutation = CreateSnapshotUploadMutation.builder().input(
                SnapshotUploadIn.builder().buildUuid(buildId).build()).build();
        try {
            CreateSnapshotUploadMutation.Data d = executeQuery(mutation).get();
            byte[] screenshot = ScreenshotHelper.getInstance().getScreenshot();
            ScreenshotHelper.getInstance().uploadToUrl(d.result.imageUploadUrl, screenshot);
            return d;
        } catch (Exception e) {
            throw new VisualApiException("yolo");
        }
    }

    void createSnapshot(SnapshotIn snapshotIn) {
        CreateSnapshotMutation mutation = new CreateSnapshotMutation(snapshotIn);
        graphQLClient.get().mutation(mutation).enqueue(response -> {
            if (response.data == null) {
                // Something wrong happened
                if (response.exception != null) {
                    // Handle non-GraphQL errors, e.g. network issues
                    response.exception.printStackTrace();
                } else {
                    // Handle GraphQL errors in response.errors
                }
            }
        });
    }

    void finishBuild(String buildId) {
        FinishBuildMutation mutation = new FinishBuildMutation(FinishBuildIn.builder().uuid(buildId).build());
        graphQLClient.get().mutation(mutation).enqueue(response -> {
            if (response.data == null) {
                // Something wrong happened
                if (response.exception != null) {
                    // Handle non-GraphQL errors, e.g. network issues
                    response.exception.printStackTrace();
                } else {
                    // Handle GraphQL errors in response.errors
                }
            }
        });
    }
}
