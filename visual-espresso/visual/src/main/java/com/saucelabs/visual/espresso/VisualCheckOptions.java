package com.saucelabs.visual.espresso;

import com.saucelabs.visual.espresso.type.RegionIn;
import com.saucelabs.visual.espresso.utils.TestMetaInfo;

import java.util.List;

public class VisualCheckOptions {
    private String testName;
    private String suiteName;
    private List<RegionIn> ignoreRegions;

    private VisualCheckOptions(String testName, String suiteName, List<RegionIn> ignoreRegions) {
        this.testName = testName;
        this.suiteName = suiteName;
        this.ignoreRegions = ignoreRegions;
    }

    public static class Builder {
        private String testName;
        private String suiteName;
        private List<RegionIn> ignoreRegions;

        public Builder withTestName(String testName) {
            this.testName = testName;
            return this;
        }

        public Builder withSuiteName(String suiteName) {
            this.suiteName = suiteName;
            return this;
        }

        public Builder withIgnoreRegions(List<RegionIn> ignoreRegions) {
            this.ignoreRegions = ignoreRegions;
            return this;
        }

        public VisualCheckOptions build() {
            return new VisualCheckOptions(testName, suiteName, ignoreRegions);
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
}
