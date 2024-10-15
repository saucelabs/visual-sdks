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
        return fromViewMatcher(viewMatcher, null);
    }

    public static RegionIn fromView(View view) {
        return fromView(view, null);
    }

    public static RegionIn fromRegion(Region region) {
        return fromRegion(region, null);
    }

    public static RegionIn fromViewMatcher(Matcher<View> viewMatcher, DiffingOptionsIn diffingOptions) {
        GetViewAction action = new GetViewAction();
        onView(viewMatcher).perform(action);
        return fromView(action.getView(), diffingOptions);
    }

    public static RegionIn fromView(View view, DiffingOptionsIn diffingOptions) {
        int[] loc = new int[2];
        view.getLocationOnScreen(loc);  // Get the coordinates of the view on the screen
        String resourceName = view.getResources().getResourceEntryName(view.getId());
        return RegionIn.builder()
                .diffingOptions(diffingOptions)
                .name(resourceName)
                .x(loc[0])
                .y(loc[1])
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
