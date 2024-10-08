package com.saucelabs.visual;

import android.view.View;

import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.graphql.type.RegionIn;
import com.saucelabs.visual.model.DiffingOption;
import com.saucelabs.visual.model.Region;
import com.saucelabs.visual.model.SelectiveRegion;
import com.saucelabs.visual.utils.RegionInFactory;
import com.saucelabs.visual.utils.TestMetaInfo;

import org.hamcrest.Matcher;

import java.util.ArrayList;
import java.util.List;

public class VisualCheckOptions {
    private final String testName;
    private final String suiteName;
    private final List<RegionIn> ignoreRegions;
    private final Boolean captureDom;
    private final DiffingOptionsIn diffingOptions;

    private VisualCheckOptions(String testName, String suiteName, List<RegionIn> ignoreRegions, Boolean captureDom, DiffingOptionsIn diffingOptions) {
        this.testName = testName;
        this.suiteName = suiteName;
        this.ignoreRegions = ignoreRegions;
        this.captureDom = captureDom;
        this.diffingOptions = diffingOptions;
    }

    public static final class Builder {
        private String testName;
        private String suiteName;
        private final List<RegionIn> ignoreRegions = new ArrayList<>();
        private Boolean captureDom;
        private DiffingOptionsIn diffingOptions;

        public Builder testName(String testName) {
            this.testName = testName;
            return this;
        }

        public Builder suiteName(String suiteName) {
            this.suiteName = suiteName;
            return this;
        }

        public Builder ignoreRegions(Region... regions) {
            for (Region region : regions) {
                this.ignoreRegions.add(RegionInFactory.fromRegion(region));
            }
            return this;
        }

        @SafeVarargs
        public final Builder ignoreRegions(Matcher<View>... viewMatchers) {
            List<RegionIn> result = new ArrayList<>();
            for (Matcher<View> viewMatcher : viewMatchers) {
                result.add(RegionInFactory.fromViewMatcher(viewMatcher));
            }
            this.ignoreRegions.addAll(result);
            return this;
        }

        public Builder ignoreRegions(View... views) {
            List<RegionIn> result = new ArrayList<>();
            for (View view : views) {
                result.add(RegionInFactory.fromView(view));
            }
            this.ignoreRegions.addAll(result);
            return this;
        }

        public Builder captureDom(boolean captureDom) {
            this.captureDom = captureDom;
            return this;
        }

        public Builder regions(SelectiveRegion... selectiveRegions) {
            for (SelectiveRegion region : selectiveRegions) {
                this.ignoreRegions.add(region.toRegionIn());
            }
            return this;
        }

        public Builder disable(DiffingOption... diffingOptions) {
            DiffingOptionsIn.Builder builder = DiffingOptionsIn.builder();
            for (DiffingOption option : diffingOptions) {
                option.apply(builder, false);
            }
            this.diffingOptions = builder.build();
            return this;
        }

        public VisualCheckOptions build() {
            return new VisualCheckOptions(testName, suiteName, ignoreRegions, captureDom, diffingOptions);
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

    public DiffingOptionsIn getDiffingOptions() {
        return diffingOptions;
    }

    public static Builder builder() {
        return new Builder();
    }
}
