package com.saucelabs.visual.espresso;

import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;

import android.view.View;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.matcher.ViewMatchers;

import org.hamcrest.Matcher;

public class GetViewAction implements ViewAction {
    private View view;
    private View parentView;

    public GetViewAction() {
    }

    public GetViewAction(View parentView) {
        this.parentView = parentView;
    }

    @Override
    public Matcher<View> getConstraints() {
        if (parentView == null) {
            return isDisplayed();
        }
        return ViewMatchers.isAssignableFrom(View.class);
    }

    @Override
    public String getDescription() {
        return "Extract view from a matcher";
    }

    @Override
    public void perform(UiController uiController, View view) {
        this.view = view;
    }

    public View getView() {
        return view;
    }

}

