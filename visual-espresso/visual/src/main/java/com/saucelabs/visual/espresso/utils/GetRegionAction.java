package com.saucelabs.visual.espresso.utils;

import android.view.View;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;

import com.saucelabs.visual.espresso.type.RegionIn;

import org.hamcrest.Matcher;

public class GetRegionAction implements ViewAction {
    private RegionIn region;

    @Override
    public Matcher<View> getConstraints() {
        return null;  // No constraints, can be applied to any view
    }

    @Override
    public String getDescription() {
        return "Get a RegionIn from a View";
    }

    @Override
    public void perform(UiController uiController, View view) {
        int[] loc = new int[2];
        view.getLocationOnScreen(loc);  // Get the coordinates of the view on the screen
        region = RegionIn.builder()
                .x(loc[0])
                .y(loc[1])
                .width(view.getWidth())
                .height(view.getHeight())
                .build();
    }

    public RegionIn getRegion() {
        return region;
    }
}

