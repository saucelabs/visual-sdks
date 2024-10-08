package com.saucelabs.visual.espresso;

import static org.junit.Assert.assertNotNull;

import com.saucelabs.visual.BuildConfig;
import com.saucelabs.visual.VisualCheckOptions;
import com.saucelabs.visual.VisualClient;
import com.saucelabs.visual.graphql.CreateSnapshotMutation;
import com.saucelabs.visual.junit.TestMetaInfoRule;
import com.saucelabs.visual.model.Region;

import org.junit.AfterClass;
import org.junit.Rule;
import org.junit.Test;

public class SmokeTest {

    @Rule
    public TestMetaInfoRule testMetaInfoRule = new TestMetaInfoRule();

    static VisualClient visual = new VisualClient.Builder(
            BuildConfig.SAUCE_USERNAME,
            BuildConfig.SAUCE_ACCESS_KEY)
            .buildName("Smoke test")
            .projectName("Espresso")
            .branchName("main")
            .build();

    @Test
    public void check() {
        CreateSnapshotMutation.Data d = visual.sauceVisualCheck("snap");
        assertNotNull(d.result.id);
    }

    @Test
    public void checkWithIgnoreRegions() {
        Region region = Region.builder()
                .x(100).y(100).width(100).height(100)
                .build();
        VisualCheckOptions options = new VisualCheckOptions.Builder()
                .ignoreRegions(region).build();
        CreateSnapshotMutation.Data d = visual.sauceVisualCheck("snap", options);
        assertNotNull(d.result.id);
    }

    @AfterClass
    public static void tearDown() {
        visual.finish();
    }
}
