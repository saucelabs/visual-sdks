package com.saucelabs.visual.model;

import android.view.View;

import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.graphql.type.RegionIn;
import com.saucelabs.visual.utils.RegionInFactory;

import org.hamcrest.Matcher;

import java.util.EnumSet;

public class SelectiveRegion {

    private Matcher<View> viewMatcher;
    private View view;

    private final EnumSet<DiffingOption> enableOnly;
    private final EnumSet<DiffingOption> disableOnly;

    private SelectiveRegion(Matcher<View> viewMatcher, EnumSet<DiffingOption> enableOnly, EnumSet<DiffingOption> disableOnly) {
        this.viewMatcher = viewMatcher;
        this.enableOnly = enableOnly;
        this.disableOnly = disableOnly;
    }

    private SelectiveRegion(View view, EnumSet<DiffingOption> enableOnly, EnumSet<DiffingOption> disableOnly) {
        this.view = view;
        this.enableOnly = enableOnly;
        this.disableOnly = disableOnly;
    }

    public static SelectiveRegion enabledFor(Matcher<View> viewMatcher) {
        return new SelectiveRegion(viewMatcher, null, null);
    }

    public static SelectiveRegion enabledFor(Matcher<View> viewMatcher, EnumSet<DiffingOption> flags) {
        return new SelectiveRegion(viewMatcher, flags, null);
    }

    public static SelectiveRegion enabledFor(View view) {
        return new SelectiveRegion(view, null, null);
    }

    public static SelectiveRegion enabledFor(View view, EnumSet<DiffingOption> flags) {
        return new SelectiveRegion(view, null, flags);
    }

    public static SelectiveRegion disabledFor(Matcher<View> viewMatcher) {
        return new SelectiveRegion(viewMatcher, null, null);
    }

    public static SelectiveRegion disabledFor(Matcher<View> viewMatcher, EnumSet<DiffingOption> flags) {
        return new SelectiveRegion(viewMatcher, null, flags);
    }

    public static SelectiveRegion disabledFor(View view) {
        return new SelectiveRegion(view, null, null);
    }

    public static SelectiveRegion disabledFor(View view, EnumSet<DiffingOption> flags) {
        return new SelectiveRegion(view, null, flags);
    }

    public RegionIn toRegionIn() {
        if (this.view != null) {
            return RegionInFactory.fromView(view, toDiffingOptionsIn(this.enableOnly, this.disableOnly));
        }
        if (this.viewMatcher != null) {
            return RegionInFactory.fromViewMatcher(viewMatcher, toDiffingOptionsIn(this.enableOnly, this.disableOnly));
        }
        throw new VisualApiException("No region has been provided");
    }

    public DiffingOptionsIn toDiffingOptionsIn(EnumSet<DiffingOption> enable, EnumSet<DiffingOption> disable) {
        DiffingOptionsIn.Builder builder = DiffingOptionsIn.builder();
        if (enable != null) {
            for (DiffingOption option : enable) {
                option.apply(builder, true);
            }
        }
        if (disable != null) {
            for (DiffingOption option : disable) {
                option.apply(builder, false);
            }
        }
        return builder.build();
    }

}
