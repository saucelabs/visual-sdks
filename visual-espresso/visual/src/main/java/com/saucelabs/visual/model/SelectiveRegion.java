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

    public static SelectiveRegion enabledFor(Matcher<View> viewMatcher, DiffingOption... options) {
        return new SelectiveRegion(viewMatcher, EnumSet.of(options[0], options), null);
    }

    public static SelectiveRegion enabledFor(View view) {
        return new SelectiveRegion(view, null, null);
    }

    public static SelectiveRegion enabledFor(View view, DiffingOption... options) {
        return new SelectiveRegion(view, EnumSet.of(options[0], options), null);
    }

    public static SelectiveRegion disabledFor(Matcher<View> viewMatcher) {
        return new SelectiveRegion(viewMatcher, null, null);
    }

    public static SelectiveRegion disabledFor(Matcher<View> viewMatcher, DiffingOption... options) {
        return new SelectiveRegion(viewMatcher, null, EnumSet.of(options[0], options));
    }

    public static SelectiveRegion disabledFor(View view) {
        return new SelectiveRegion(view, null, null);
    }

    public static SelectiveRegion disabledFor(View view, DiffingOption... options) {
        return new SelectiveRegion(view, null, EnumSet.of(options[0], options));
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

    public static DiffingOptionsIn toDiffingOptionsIn(EnumSet<DiffingOption> enable, EnumSet<DiffingOption> disable) {
        DiffingOptionsIn.Builder builder = DiffingOptionsIn.builder();
        if (enable != null) {
            builder = getBuilderWithDefault(builder, false);
            for (DiffingOption option : enable) {
                option.apply(builder, true);
            }
        }
        if (disable != null) {
            builder = getBuilderWithDefault(builder, true);
            for (DiffingOption option : disable) {
                option.apply(builder, false);
            }
        }
        return builder.build();
    }

    public static DiffingOptionsIn.Builder getBuilderWithDefault(DiffingOptionsIn.Builder builder, boolean value) {
        return builder
                .content(value)
                .dimensions(value)
                .position(value)
                .structure(value)
                .style(value)
                .visual(value);
    }

}
