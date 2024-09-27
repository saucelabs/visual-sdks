package com.saucelabs.visual.espresso;

import com.saucelabs.visual.espresso.exception.VisualApiException;

public enum DataCenter {
    US_WEST_1("https://api.us-west-1.saucelabs.com/v1/visual/graphql"),
    US_EAST_4("https://api.us-east-4.saucelabs.com/v1/visual/graphql"),
    EU_CENTRAL_1("https://api.eu-central-1.saucelabs.com/v1/visual/graphql");

    public final String endpoint;

    DataCenter(String endpoint) {
        this.endpoint = endpoint;
    }

    public static DataCenter fromSauceRegion(String sauceRegion) {
        if (sauceRegion == null) {
            return US_WEST_1;
        }
        switch (sauceRegion) {
            case "us-west-1":
                return US_WEST_1;
            case "eu-central-1":
                return EU_CENTRAL_1;
            case "us-east-4":
                return US_EAST_4;
            default:
                throw new VisualApiException("Unknown region: " + sauceRegion);
        }
    }
}
