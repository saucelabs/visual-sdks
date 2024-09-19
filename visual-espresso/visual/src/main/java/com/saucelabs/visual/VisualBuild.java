package com.saucelabs.visual;

public class VisualBuild {

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

    private static volatile VisualBuild build = null;

    public static VisualBuild getBuildOnce(VisualApi visualApi, BuildAttributes buildAttributes) {
        synchronized (VisualBuild.class) {
            if (build == null) {
                build = visualApi.createBuild(buildAttributes);
                Runtime.getRuntime().addShutdownHook(new Thread(() -> visualApi.finishBuild(build.id)));
            }
        }
        return build;
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
}
