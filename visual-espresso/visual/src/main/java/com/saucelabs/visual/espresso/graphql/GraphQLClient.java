package com.saucelabs.visual.espresso.graphql;

import android.text.TextUtils;
import android.util.Base64;

import com.apollographql.apollo.api.ApolloResponse;
import com.apollographql.apollo.api.Mutation;
import com.apollographql.apollo.api.Operation;
import com.apollographql.apollo.api.Query;
import com.apollographql.java.client.ApolloClient;
import com.saucelabs.visual.BuildConfig;
import com.saucelabs.visual.espresso.DataCenter;
import com.saucelabs.visual.espresso.exception.VisualApiException;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

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

    public <D extends Query.Data> D executeQuery(Query<D> m) {
        CompletableFuture<D> future = new CompletableFuture<>();
        this.client.query(m).enqueue(response -> handleResponse(response, future));
        try {
            return future.get();
        } catch (ExecutionException | InterruptedException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
    }

    public <D extends Mutation.Data> D executeMutation(Mutation<D> m) {
        CompletableFuture<D> future = new CompletableFuture<>();
        this.client.mutation(m).enqueue(response -> handleResponse(response, future));
        try {
            return future.get();
        } catch (ExecutionException | InterruptedException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
    }

    private <D extends Operation.Data> void handleResponse(ApolloResponse<D> response, CompletableFuture<D> future) {
        if (response.data != null) {
            future.complete(response.data);
        } else if (response.exception != null) {
            future.completeExceptionally(response.exception);
        } else {
            future.completeExceptionally(new VisualApiException("Unexpected GraphQL error"));
        }
    }
}
