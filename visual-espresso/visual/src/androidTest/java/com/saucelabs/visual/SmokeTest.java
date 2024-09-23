package com.saucelabs.visual;

import org.junit.Test;

public class SmokeTest {

    @Test
    public void check() {
        VisualClient visual = new VisualClient.Builder(
                BuildConfig.SAUCE_USERNAME,
                BuildConfig.SAUCE_ACCESS_KEY)
                .withBuildName("Smoke test")
                .withProjectName("Espresso")
                .withBranchName("main")
                .build();
        visual.sauceVisualCheck("snap");
    }
}
