package com.saucelabs.visual.utils;

import static androidx.test.espresso.Espresso.onView;

import android.view.View;

import com.saucelabs.visual.espresso.GetViewAction;
import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.graphql.type.RegionIn;
import com.saucelabs.visual.model.Region;

import org.hamcrest.Matcher;


public class RegionInFactory {

    public static RegionIn fromViewMatcher(Matcher<View> viewMatcher) {
        return fromViewMatcher(viewMatcher, null, null);
    }

    public static RegionIn fromViewMatcher(Matcher<View> viewMatcher, View parentView) {
        return fromViewMatcher(viewMatcher, null, parentView);
    }

    public static RegionIn fromViewMatcher(Matcher<View> viewMatcher, DiffingOptionsIn diffingOptions) {
        return fromViewMatcher(viewMatcher, diffingOptions, null);
    }

    public static RegionIn fromViewMatcher(Matcher<View> viewMatcher, DiffingOptionsIn diffingOptions, View parentView) {
        GetViewAction action = new GetViewAction();
        onView(viewMatcher).perform(action);
        return fromView(action.getView(), diffingOptions, parentView);
    }

    public static RegionIn fromView(View view) {
        return fromView(view, null);
    }

    public static RegionIn fromRegion(Region region) {
        return fromRegion(region, null);
    }

    public static RegionIn fromView(View view, DiffingOptionsIn diffingOptions) {
        return fromView(view, diffingOptions, null);
    }

    public static RegionIn fromView(View view, DiffingOptionsIn diffingOptions, View parentView) {
        int[] loc = new int[2];
        view.getLocationOnScreen(loc);
        int[] parentLoc = new int[2];
        if (parentView != null) {
            parentView.getLocationOnScreen(parentLoc);
        }
        String resourceName = view.getResources().getResourceEntryName(view.getId());
        return RegionIn.builder()
                .diffingOptions(diffingOptions)
                .name(resourceName)
                .x(loc[0] - parentLoc[0])
                .y(loc[1] - parentLoc[1])
                .width(view.getWidth())
                .height(view.getHeight())
                .build();
    }

    public static RegionIn fromRegion(Region region, DiffingOptionsIn diffingOptions) {
        return RegionIn.builder()
                .diffingOptions(diffingOptions)
                .name(region.getName())
                .x(region.getX())
                .y(region.getY())
                .width(region.getWidth())
                .height(region.getHeight())
                .build();
    }
}
