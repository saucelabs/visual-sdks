package com.saucelabs.visual.model;

import static com.saucelabs.visual.BuildConfig.SAUCE_REGION;

import android.text.TextUtils;

import com.saucelabs.visual.exception.VisualApiException;

public enum DataCenter {
    US_WEST_1("https://api.us-west-1.saucelabs.com/v1/visual/graphql"),
    US_EAST_4("https://api.us-east-4.saucelabs.com/v1/visual/graphql"),
    EU_CENTRAL_1("https://api.eu-central-1.saucelabs.com/v1/visual/graphql");

    public final String endpoint;

    DataCenter(String endpoint) {
        this.endpoint = endpoint;
    }

    public static DataCenter fromSauceRegion(String region) {
        if (TextUtils.isEmpty(region)) {
            return US_WEST_1;
        }
        switch (region) {
            case "us-west-1":
                return US_WEST_1;
            case "eu-central-1":
                return EU_CENTRAL_1;
            case "us-east-4":
                return US_EAST_4;
            default:
                throw new VisualApiException("Unknown region: " + SAUCE_REGION);
        }
    }
}
