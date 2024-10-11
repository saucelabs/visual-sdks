package com.saucelabs.visual.utils;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Point;
import android.view.Display;
import android.view.WindowManager;

import androidx.test.platform.app.InstrumentationRegistry;

import com.saucelabs.visual.graphql.type.RegionIn;

public class BarCoordinatesHelper {

    public static RegionIn getStatusBarRegion() {
        int statusBarHeight = getStatusBarHeight();
        int screenWidth = getScreenWidth();
        return RegionIn.builder()
                .x(0)
                .y(0)
                .width(screenWidth)
                .height(statusBarHeight)
                .build();
    }

    public static RegionIn getNavigationBarRegion() {
        int navigationBarHeight = getNavigationBarHeight();
        int screenHeight = getScreenHeight();
        int screenWidth = getScreenWidth();
        return RegionIn.builder()
                .x(0)
                .y(screenHeight - navigationBarHeight)
                .width(screenWidth)
                .height(navigationBarHeight)
                .build();
    }

    private static int getStatusBarHeight() {
        int statusBarHeight = 0;
        Resources resources = InstrumentationRegistry.getInstrumentation().getContext().getResources();
        int resourceId = resources.getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {
            statusBarHeight = resources.getDimensionPixelSize(resourceId);
        }
        return statusBarHeight;
    }

    private static int getNavigationBarHeight() {
        int navigationBarHeight = 0;
        Resources resources = InstrumentationRegistry.getInstrumentation().getContext().getResources();
        int resourceId = resources.getIdentifier("navigation_bar_height", "dimen", "android");
        if (resourceId > 0) {
            navigationBarHeight = resources.getDimensionPixelSize(resourceId);
        }
        return navigationBarHeight;
    }

    private static int getScreenHeight() {
        WindowManager wm = (WindowManager) InstrumentationRegistry.getInstrumentation().getContext()
                .getSystemService(Context.WINDOW_SERVICE);
        Display display = wm.getDefaultDisplay();
        Point size = new Point();
        display.getSize(size);
        return size.y;
    }

    private static int getScreenWidth() {
        WindowManager wm = (WindowManager) InstrumentationRegistry.getInstrumentation().getContext()
                .getSystemService(Context.WINDOW_SERVICE);
        Display display = wm.getDefaultDisplay();
        Point size = new Point();
        display.getSize(size);
        return size.x;
    }
}
