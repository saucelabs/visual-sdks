package com.saucelabs.visual.graphql;

import android.text.TextUtils;
import android.util.Base64;

import com.apollographql.apollo.ApolloCall;
import com.apollographql.apollo.ApolloClient;
import com.apollographql.apollo.api.ApolloResponse;
import com.apollographql.apollo.api.Error;
import com.apollographql.apollo.api.Mutation;
import com.apollographql.apollo.api.Operation;
import com.apollographql.apollo.api.Query;
import com.saucelabs.visual.BuildConfig;
import com.saucelabs.visual.DataCenter;
import com.saucelabs.visual.exception.VisualApiException;

import kotlin.coroutines.EmptyCoroutineContext;
import kotlinx.coroutines.BuildersKt;

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
        return handleResponse(executeBlocking(client.query(q)));
    }

    public <D extends Mutation.Data> D executeMutation(Mutation<D> m) {
        return handleResponse(executeBlocking(client.mutation(m)));
    }

    @SuppressWarnings("unchecked")
    private <D extends Operation.Data> ApolloResponse<D> executeBlocking(ApolloCall<D> call) {
        try {
            return (ApolloResponse<D>) BuildersKt.runBlocking(
                    EmptyCoroutineContext.INSTANCE,
                    (scope, continuation) -> call.execute(continuation));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new VisualApiException("Interrupted while executing GraphQL call");
        }
    }

    private <D extends Operation.Data> D handleResponse(ApolloResponse<D> response) {
        if (response.data != null) {
            return response.data;
        } else if (response.errors != null) {
            StringBuilder message = new StringBuilder();
            for (Error error : response.errors) {
                if (message.length() > 0) {
                    message.append(", ");
                }
                message.append(error.getMessage());
            }
            throw new VisualApiException(message.toString());
        } else if (response.exception != null) {
            throw new VisualApiException(response.exception.getMessage());
        } else {
            throw new VisualApiException("Unexpected GraphQL error");
        }
    }

}
