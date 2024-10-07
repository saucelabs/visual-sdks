package com.saucelabs.visual.espresso;

import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;

import android.view.View;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;

import org.hamcrest.Matcher;

public class GetViewAction implements ViewAction {
    private View view;

    @Override
    public Matcher<View> getConstraints() {
        return isDisplayed();
    }

    @Override
    public String getDescription() {
        return "Get a Region from a View";
    }

    @Override
    public void perform(UiController uiController, View view) {
        this.view = view;
    }

    public View getView() {
        return view;
    }

}

