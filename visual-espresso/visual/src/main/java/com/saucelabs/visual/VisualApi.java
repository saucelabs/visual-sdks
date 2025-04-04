package com.saucelabs.visual;

import android.util.Log;
import android.view.View;

import com.saucelabs.visual.VisualBuild.BuildAttributes;
import com.saucelabs.visual.graphql.BuildByCustomIdQuery;
import com.saucelabs.visual.graphql.BuildQuery;
import com.saucelabs.visual.graphql.CreateBuildMutation;
import com.saucelabs.visual.graphql.CreateSnapshotMutation;
import com.saucelabs.visual.graphql.CreateSnapshotUploadMutation;
import com.saucelabs.visual.graphql.FinishBuildMutation;
import com.saucelabs.visual.graphql.GraphQLClient;
import com.saucelabs.visual.graphql.type.BuildIn;
import com.saucelabs.visual.graphql.type.FinishBuildIn;
import com.saucelabs.visual.graphql.type.SnapshotIn;
import com.saucelabs.visual.graphql.type.SnapshotUploadIn;
import com.saucelabs.visual.utils.SnapshotHelper;

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

    CreateSnapshotUploadMutation.Data uploadSnapshot(String buildId, boolean captureDom, View clipElement, View scrollView) {
        SnapshotUploadIn input = SnapshotUploadIn.builder().buildUuid(buildId).build();
        CreateSnapshotUploadMutation m = CreateSnapshotUploadMutation.builder().input(input).build();
        CreateSnapshotUploadMutation.Data data = graphQLClient.executeMutation(m);

        if (captureDom) {
            byte[] dom;
            if (clipElement != null) {
                dom = SnapshotHelper.getInstance().captureDom(clipElement);
            } else if (scrollView != null) {
                dom = SnapshotHelper.getInstance().captureDom(scrollView);
            } else {
                dom = SnapshotHelper.getInstance().captureDom(null);
            }
            SnapshotHelper.getInstance().uploadDom(data.result.domUploadUrl, dom);
        }

        byte[] screenshot;
        if (clipElement != null && clipElement == scrollView) { // Clip and fps views are same
            screenshot = SnapshotHelper.getInstance().captureView(clipElement, true);
        } else if (clipElement != null) { // Only clipping
            screenshot = SnapshotHelper.getInstance().captureView(clipElement, false);
        } else if (scrollView != null) { // Full page, no clipping
            screenshot = SnapshotHelper.getInstance().captureView(scrollView, true);
        } else { // No clipping, no full page
            screenshot = SnapshotHelper.getInstance().captureScreen();
        }
        SnapshotHelper.getInstance().uploadScreenshot(data.result.imageUploadUrl, screenshot);

        return data;
    }

    CreateSnapshotMutation.Data createSnapshot(SnapshotIn snapshotIn) {
        CreateSnapshotMutation m = new CreateSnapshotMutation(snapshotIn);
        return graphQLClient.executeMutation(m);
    }

    void finishBuild(String buildId) {
        FinishBuildIn input = FinishBuildIn.builder().uuid(buildId).build();
        FinishBuildMutation m = new FinishBuildMutation(input);
        graphQLClient.executeMutation(m);
    }

    BuildQuery.Data getBuild(String buildId) {
        BuildQuery q = new BuildQuery(buildId);
        return graphQLClient.executeQuery(q);
    }

    BuildByCustomIdQuery.Data getBuildByCustomId(String customId) {
        BuildByCustomIdQuery q = new BuildByCustomIdQuery(customId);
        return graphQLClient.executeQuery(q);
    }

}
