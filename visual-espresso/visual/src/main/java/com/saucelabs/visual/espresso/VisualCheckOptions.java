package com.saucelabs.visual.espresso;

import com.saucelabs.visual.espresso.utils.TestMetaInfo;

public class VisualCheckOptions {
    private String testName;
    private String suiteName;

    public VisualCheckOptions() {
    }

    public VisualCheckOptions(String testName, String suiteName) {
        this.testName = testName;
        this.suiteName = suiteName;
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
}
