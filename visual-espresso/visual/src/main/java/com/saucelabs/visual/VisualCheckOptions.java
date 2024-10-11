package com.saucelabs.visual;

import static androidx.test.espresso.Espresso.onView;

import android.view.View;

import com.saucelabs.visual.espresso.GetViewAction;
import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.graphql.type.RegionIn;
import com.saucelabs.visual.model.Region;
import com.saucelabs.visual.utils.BarRegionHelper;
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
    private final View clipElement;

    private VisualCheckOptions(
            String testName,
            String suiteName,
            List<RegionIn> ignoreRegions,
            Boolean captureDom,
            DiffingOptionsIn diffingOptions,
            View clipElement) {
        this.testName = testName;
        this.suiteName = suiteName;
        this.ignoreRegions = ignoreRegions;
        this.captureDom = captureDom;
        this.diffingOptions = diffingOptions;
        this.clipElement = clipElement;
    }

    public static final class Builder {
        private String testName;
        private String suiteName;
        private final List<RegionIn> ignoreRegions = new ArrayList<>();
        private Boolean captureDom;
        private DiffingOptionsIn diffingOptions;
        private View clipElement;

        public Builder testName(String testName) {
            this.testName = testName;
            return this;
        }

        public Builder suiteName(String suiteName) {
            this.suiteName = suiteName;
            return this;
        }

        public Builder ignore(Region... regions) {
            for (Region region : regions) {
                this.ignoreRegions.add(RegionInFactory.fromRegion(region));
            }
            return this;
        }

        @SafeVarargs
        public final Builder ignore(Matcher<View>... viewMatchers) {
            List<RegionIn> result = new ArrayList<>();
            for (Matcher<View> viewMatcher : viewMatchers) {
                result.add(RegionInFactory.fromViewMatcher(viewMatcher));
            }
            this.ignoreRegions.addAll(result);
            return this;
        }

        public Builder ignore(View... views) {
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

        public Builder clipElement(Matcher<View> viewMatcher) {
            GetViewAction action = new GetViewAction();
            onView(viewMatcher).perform(action);
            this.clipElement = action.getView();
            return this;
        }

        public Builder clipElement(View view) {
            this.clipElement = view;
            return this;
        }

        public VisualCheckOptions build() {
            return new VisualCheckOptions(
                    testName,
                    suiteName,
                    ignoreRegions,
                    captureDom,
                    diffingOptions,
                    clipElement);
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
        ignoreRegions.add(BarRegionHelper.getStatusBarRegion());
        ignoreRegions.add(BarRegionHelper.getNavigationBarRegion());
        return ignoreRegions;
    }

    public Boolean getCaptureDom() {
        return captureDom;
    }

    public DiffingOptionsIn getDiffingOptions() {
        return diffingOptions;
    }

    public View getClipElement() {
        return clipElement;
    }

    public static Builder builder() {
        return new Builder();
    }
}
