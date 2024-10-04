package com.saucelabs.visual.graphql;

import android.text.TextUtils;
import android.util.Base64;

import com.apollographql.apollo.api.ApolloResponse;
import com.apollographql.apollo.api.Mutation;
import com.apollographql.apollo.api.Operation;
import com.apollographql.apollo.api.Query;
import com.apollographql.java.client.ApolloClient;
import com.saucelabs.visual.BuildConfig;
import com.saucelabs.visual.DataCenter;
import com.saucelabs.visual.exception.VisualApiException;

import java.util.concurrent.CountDownLatch;

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
                .addHttpHeader("User-Agent", "sauce-visual-espresso/" + BuildConfig.VERSION_NAME)
                .build();
    }

    public GraphQLClient(ApolloClient apolloClient) {
        this.client = apolloClient;
    }

    public <D extends Query.Data> D executeQuery(Query<D> q) {
        final D[] result = (D[]) new Query.Data[1]; // Placeholder for the result
        final Exception[] exception = new Exception[1]; // Placeholder for exceptions
        final CountDownLatch latch = new CountDownLatch(1);

        // Execute the query and handle the response
        this.client.query(q).enqueue(response -> handleResponse(response, result, exception, latch));

        try {
            latch.await(); // Wait for the query to complete
        } catch (InterruptedException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }

        if (exception[0] != null) {
            throw new VisualApiException(exception[0].getLocalizedMessage());
        }

        return result[0];
    }


    public <D extends Mutation.Data> D executeMutation(Mutation<D> m) {
        final D[] result = (D[]) new Mutation.Data[1]; // Placeholder for the result
        final Exception[] exception = new Exception[1]; // Placeholder for exceptions
        final CountDownLatch latch = new CountDownLatch(1);

        // Execute the mutation and handle the response
        this.client.mutation(m).enqueue(response -> handleResponse(response, result, exception, latch));

        try {
            latch.await(); // Wait for the mutation to complete
        } catch (InterruptedException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }

        if (exception[0] != null) {
            throw new VisualApiException(exception[0].getLocalizedMessage());
        }

        return result[0];
    }

    private <D extends Operation.Data> void handleResponse(ApolloResponse<D> response, D[] result, Exception[] exception, CountDownLatch latch) {
        if (response.data != null) {
            result[0] = response.data;  // Assign the result
        } else if (response.exception != null) {
            exception[0] = response.exception;  // Capture the exception
        } else {
            exception[0] = new VisualApiException("Unexpected GraphQL error");
        }
        latch.countDown(); // Signal that the response handling is done
    }
}
