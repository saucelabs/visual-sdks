package com.saucelabs.visual.espresso;

import com.saucelabs.visual.BuildConfig;
import com.saucelabs.visual.espresso.junit.TestMetaInfoRule;

import org.junit.After;
import org.junit.Rule;
import org.junit.Test;

public class SmokeTest {

    @Rule
    public TestMetaInfoRule testMetaInfoRule = new TestMetaInfoRule();

    VisualClient visual;

    @Test
    public void check() {
        visual = new VisualClient.Builder(
                BuildConfig.SAUCE_USERNAME,
                BuildConfig.SAUCE_ACCESS_KEY)
                .withBuildName("Smoke test")
                .withProjectName("Espresso")
                .withBranchName("main")
                .build();
        visual.sauceVisualCheck("snap");
    }

    @After
    public void tearDown() {
        //visual.finish();
    }
}
