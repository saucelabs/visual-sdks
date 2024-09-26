package com.saucelabs.visual.espresso.graphql;

import android.text.TextUtils;
import android.util.Base64;

import com.apollographql.java.client.ApolloClient;
import com.saucelabs.visual.espresso.exception.VisualApiException;
import com.saucelabs.visual.espresso.model.DataCenter;

public class GraphQLClient {

    private final ApolloClient client;

    public GraphQLClient(String username, String accessKey) {
        this(DataCenter.US_WEST_1, username, accessKey);
    }

    public GraphQLClient(DataCenter region, String username, String accessKey) {
        if (TextUtils.isEmpty(username) || TextUtils.isEmpty(accessKey)) {
            throw new VisualApiException("Invalid SauceLabs credentials. Please check your SauceLabs username and access key at https://app.saucelabs.com/user-setting");
        }
        String authentication = Base64.encodeToString((username + ":" + accessKey).getBytes(), Base64.NO_WRAP);
        this.client = new ApolloClient.Builder()
                .serverUrl(region.endpoint)
                .addHttpHeader("Content-Type", "application/json")
                .addHttpHeader("Accept", "application/json")
                .addHttpHeader("Authorization", "Basic " + authentication)
                .addHttpHeader("User-Agent", "sauce-visual-espresso/0.0.1")
                .build();
    }

    public GraphQLClient(ApolloClient apolloClient) {
        this.client = apolloClient;
    }

    public ApolloClient get() {
        return client;
    }
}
