package com.saucelabs.visual;

import android.text.TextUtils;
import android.util.Log;

import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.BuildByCustomIdQuery;
import com.saucelabs.visual.graphql.BuildQuery;
import com.saucelabs.visual.graphql.CreateBuildMutation;
import com.saucelabs.visual.graphql.type.BuildMode;

import java.util.UUID;

public class VisualBuild {
    private final static String LOG_TAG = VisualBuild.class.getSimpleName();

    private final String id;
    private final String name;
    private final String project;
    private final String branch;
    private final String defaultBranch;
    private final String url;

    VisualBuild(
            String id, String name, String project, String branch, String defaultBranch, String url) {
        this.id = id;
        this.name = name;
        this.project = project;
        this.branch = branch;
        this.defaultBranch = defaultBranch;
        this.url = url;
    }

    VisualBuild(CreateBuildMutation.Data data) {
        this(data.result.id.toString(),
                data.result.name,
                data.result.project,
                data.result.branch,
                data.result.defaultBranch,
                data.result.url);
    }

    VisualBuild(BuildQuery.Data data) {
        this(data.result.id.toString(),
                data.result.name,
                data.result.project,
                data.result.branch,
                data.result.defaultBranch,
                data.result.url);
    }

    VisualBuild(BuildByCustomIdQuery.Data data) {
        this(data.result.id.toString(),
                data.result.name,
                data.result.project,
                data.result.branch,
                data.result.defaultBranch,
                data.result.url);
    }

    public String getId() {
        return id;
    }

    private static volatile VisualBuild build = null;

    public static VisualBuild getBuildOnce(VisualApi visualApi,
                                           BuildAttributes buildAttributes,
                                           String customId,
                                           String buildId) {
        synchronized (VisualBuild.class) {
            if (build == null) {
                VisualBuild externalBuild = getExternalBuild(visualApi, customId, buildId);
                if (externalBuild != null) {
                    Log.i(LOG_TAG, String.format(" %n   Sauce Visual: %n%85s%n ", externalBuild.url));
                    build = externalBuild;
                } else {
                    build = visualApi.createBuild(buildAttributes);
                }
            }
        }
        return build;
    }

    public static VisualBuild getExternalBuild(VisualApi api, String customId, String buildId) {
        if (!TextUtils.isEmpty(buildId)) {
            ensureValidUUID(buildId);
            BuildQuery.Data data = api.getBuild(buildId);
            if (data.result != null) {
                if (data.result.mode == BuildMode.COMPLETED) {
                    Log.e(LOG_TAG, "Sauce Labs Visual: cannot add more screenshots since the build is already completed");
                    throw new VisualApiException("Build is already completed");
                }
                return new VisualBuild(data);
            }
        }
        if (!TextUtils.isEmpty(customId)) {
            BuildByCustomIdQuery.Data data = api.getBuildByCustomId(customId);
            if (data.result != null) {
                if (data.result.mode == BuildMode.COMPLETED) {
                    Log.e(LOG_TAG, "Sauce Labs Visual: cannot add more screenshots since the build is already completed");
                    throw new VisualApiException("Build is already completed");
                }
                return new VisualBuild(data);
            }
        }
        return null;
    }

    public static class BuildAttributes {
        public final String name;
        public final String project;
        public final String branch;
        public final String defaultBranch;

        public BuildAttributes(String name, String project, String branch, String defaultBranch) {
            this.name = name;
            this.project = project;
            this.branch = branch;
            this.defaultBranch = defaultBranch;
        }
    }

    private static void ensureValidUUID(String uuid) {
        try {
            UUID.fromString(uuid);
        } catch (Exception e) {
            throw new VisualApiException("External build ID is not a valid UUID");
        }
    }
}
