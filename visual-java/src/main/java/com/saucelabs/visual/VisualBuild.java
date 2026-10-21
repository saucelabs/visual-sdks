package com.saucelabs.visual;

import static com.saucelabs.visual.utils.EnvironmentVariables.isNotBlank;

import com.saucelabs.visual.VisualApi.BuildAttributes;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.BuildByCustomIdQuery;
import com.saucelabs.visual.graphql.BuildQuery;
import com.saucelabs.visual.graphql.type.BuildMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class VisualBuild {
  private static final Logger log = LoggerFactory.getLogger(VisualBuild.class);

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

  public String getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getProject() {
    return project;
  }

  public String getBranch() {
    return branch;
  }

  public String getUrl() {
    return url;
  }

  public String getDefaultBranch() {
    return defaultBranch;
  }

  private static volatile VisualBuild build = null;

  public static VisualBuild getBuildOnce(VisualApi api, BuildAttributes buildAttributes) {
    synchronized (VisualBuild.class) {
      if (build == null) {
        VisualBuild externalBuild = getExternalBuild(api, buildAttributes);
        if (externalBuild != null) {
          build = externalBuild;
        } else {
          build = api.createBuild(buildAttributes);
          Runtime.getRuntime().addShutdownHook(new Thread(() -> api.finishBuild(build.id)));
        }
      }
    }
    return build;
  }

  public static VisualBuild getExternalBuild(VisualApi api) {
    return getExternalBuild(api, new BuildAttributes(null, null, null, null, null, null));
  }

  public static VisualBuild getExternalBuild(VisualApi api, BuildAttributes buildAttributes) {
    String buildId = buildAttributes.getBuildId();
    if (isNotBlank(buildId)) {
      BuildQuery.Result build = api.getBuildById(buildId);
      if (build != null) {
        if (build.mode == BuildMode.COMPLETED) {
          log.error(
              "Sauce Labs Visual: cannot add more screenshots since the build is already completed");
          throw new VisualApiException("Build is already completed");
        }
        return new VisualBuild(
            build.id, build.name, build.project, build.branch, build.defaultBranch, build.url);
      }
    }
    String customId = buildAttributes.getCustomId();
    if (isNotBlank(customId)) {
      BuildByCustomIdQuery.Result build = api.getBuildByCustomId(customId);
      if (build != null) {
        if (build.mode == BuildMode.COMPLETED) {
          log.error(
              "Sauce Labs Visual: cannot add more screenshots since the build is already completed");
          throw new VisualApiException("Build is already completed");
        }
        return new VisualBuild(
            build.id, build.name, build.project, build.branch, build.defaultBranch, build.url);
      }
    }
    return null;
  }

  /**
   * @deprecated Use {@link #getBuildOnce(VisualApi, BuildAttributes)} instead.
   * @param api
   * @param buildAttributes
   * @return
   */
  @Deprecated
  public static String getOnce(VisualApi api, BuildAttributes buildAttributes) {
    return getBuildOnce(api, buildAttributes).getId();
  }
}
