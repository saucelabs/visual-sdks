package com.saucelabs.visual.espresso;

import static org.junit.Assert.assertNotNull;

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
        CreateSnapshotMutation.Data d = visual.sauceVisualCheck("snap");
        assertNotNull(d.result.id);
    }

    @After
    public void tearDown() {
        visual.finish();
    }
}
