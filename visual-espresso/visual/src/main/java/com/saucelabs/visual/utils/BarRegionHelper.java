package com.saucelabs.visual.utils;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Point;
import android.view.Display;
import android.view.WindowManager;

import androidx.test.platform.app.InstrumentationRegistry;

import com.saucelabs.visual.graphql.type.RegionIn;

public class BarRegionHelper {

    public static RegionIn getStatusBarRegion() {
        int statusBarHeight = getStatusBarHeight();
        int screenWidth = getScreenSize().x;
        return RegionIn.builder()
                .x(0)
                .y(0)
                .width(screenWidth)
                .height(statusBarHeight)
                .build();
    }

    public static RegionIn getNavigationBarRegion() {
        int navigationBarHeight = getNavigationBarHeight();
        Point screenSize = getScreenSize();
        int screenHeight = screenSize.y;
        int screenWidth = screenSize.x;
        return RegionIn.builder()
                .x(0)
                .y(screenHeight - navigationBarHeight)
                .width(screenWidth)
                .height(navigationBarHeight)
                .build();
    }

    private static int getStatusBarHeight() {
        return getBarHeight("status_bar_height");
    }

    private static int getNavigationBarHeight() {
        return getBarHeight("navigation_bar_height");
    }

    private static int getBarHeight(String resourceName) {
        Resources resources = InstrumentationRegistry.getInstrumentation().getContext().getResources();
        int resourceId = resources.getIdentifier(resourceName, "dimen", "android");
        return resourceId > 0 ? resources.getDimensionPixelSize(resourceId) : 0;
    }

    private static Point getScreenSize() {
        WindowManager wm = (WindowManager) InstrumentationRegistry.getInstrumentation().getContext()
                .getSystemService(Context.WINDOW_SERVICE);
        Display display = wm.getDefaultDisplay();
        Point size = new Point();
        display.getSize(size);
        return size;
    }
}
