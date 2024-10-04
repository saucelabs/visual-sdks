package com.saucelabs.visual.espresso;

import static androidx.test.espresso.Espresso.onView;

import android.view.View;

import com.saucelabs.visual.espresso.type.RegionIn;
import com.saucelabs.visual.espresso.utils.GetRegionAction;
import com.saucelabs.visual.espresso.utils.TestMetaInfo;

import org.hamcrest.Matcher;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class VisualCheckOptions {
    private final String testName;
    private final String suiteName;
    private final List<RegionIn> ignoreRegions;
    private final Boolean captureDom;

    private VisualCheckOptions(String testName, String suiteName, List<RegionIn> ignoreRegions, Boolean captureDom) {
        this.testName = testName;
        this.suiteName = suiteName;
        this.ignoreRegions = ignoreRegions;
        this.captureDom = captureDom;
    }

    public static class Builder {
        private String testName;
        private String suiteName;
        private final List<RegionIn> ignoreRegions = new ArrayList<>();
        private Boolean captureDom;

        public Builder withTestName(String testName) {
            this.testName = testName;
            return this;
        }

        public Builder withSuiteName(String suiteName) {
            this.suiteName = suiteName;
            return this;
        }

        public Builder withIgnoreRegions(RegionIn... regions) {
            this.ignoreRegions.addAll(Arrays.asList(regions));
            return this;
        }

        @SafeVarargs
        public final Builder withIgnoreRegions(Matcher<View>... regions) {
            List<RegionIn> ignoreRegions = new ArrayList<>();
            for (Matcher<View> region : regions) {
                GetRegionAction action = new GetRegionAction();
                onView(region).perform(action);
                ignoreRegions.add(action.getRegion());
            }
            this.ignoreRegions.addAll(ignoreRegions);
            return this;
        }

        public Builder withIgnoreRegions(View... regions) {
            List<RegionIn> ignoreRegions = new ArrayList<>();
            for (View view : regions) {
                ignoreRegions.add(GetRegionAction.toRegion(view));
            }
            this.ignoreRegions.addAll(ignoreRegions);
            return this;
        }

        public Builder enableCaptureDom() {
            this.captureDom = true;
            return this;
        }

        public VisualCheckOptions build() {
            return new VisualCheckOptions(testName, suiteName, ignoreRegions, captureDom);
        }

    }

    public String resolveTestName() {
        if (this.testName != null) {
            return this.testName;
        } else {
            TestMetaInfo metaInfo = TestMetaInfo.THREAD_LOCAL.get();
            if (metaInfo != null) {
                return metaInfo.getTestName();
            }
        }
        return null;
    }

    public String resolveSuiteName() {
        if (this.suiteName != null) {
            return this.suiteName;
        } else {
            TestMetaInfo metaInfo = TestMetaInfo.THREAD_LOCAL.get();
            if (metaInfo != null) {
                return metaInfo.getTestSuite();
            }
        }
        return null;
    }

    public List<RegionIn> getIgnoreRegions() {
        return ignoreRegions;
    }

    public Boolean getCaptureDom() {
        return captureDom;
    }
}
