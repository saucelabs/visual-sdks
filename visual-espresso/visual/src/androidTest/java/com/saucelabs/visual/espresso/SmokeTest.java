package com.saucelabs.visual.espresso;

import static org.junit.Assert.assertNotNull;

import com.saucelabs.visual.BuildConfig;
import com.saucelabs.visual.espresso.junit.TestMetaInfoRule;
import com.saucelabs.visual.espresso.type.RegionIn;

import org.junit.AfterClass;
import org.junit.Rule;
import org.junit.Test;

public class SmokeTest {

    @Rule
    public TestMetaInfoRule testMetaInfoRule = new TestMetaInfoRule();

    static VisualClient visual = new VisualClient.Builder(
            BuildConfig.SAUCE_USERNAME,
            BuildConfig.SAUCE_ACCESS_KEY)
            .withBuildName("Smoke test")
            .withProjectName("Espresso")
            .withBranchName("main")
            .build();

    @Test
    public void check() {
        CreateSnapshotMutation.Data d = visual.sauceVisualCheck("snap");
        assertNotNull(d.result.id);
    }

    @Test
    public void checkWithIgnoreRegions() {
        RegionIn ignore = RegionIn.builder()
                .x(100).y(100).width(100).height(100)
                .build();
        VisualCheckOptions options = new VisualCheckOptions.Builder()
                .withIgnoreRegions(ignore).build();
        CreateSnapshotMutation.Data d = visual.sauceVisualCheck("snap", options);
        assertNotNull(d.result.id);
    }

    @AfterClass
    public static void tearDown() {
        visual.finish();
    }
}
