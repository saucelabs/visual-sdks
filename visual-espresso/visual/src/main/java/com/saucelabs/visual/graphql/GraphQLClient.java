package com.saucelabs.visual.graphql;

import android.text.TextUtils;
import android.util.Base64;

import com.apollographql.apollo3.ApolloCall;
import com.apollographql.apollo3.ApolloClient;
import com.apollographql.apollo3.api.ApolloResponse;
import com.apollographql.apollo3.api.Error;
import com.apollographql.apollo3.api.Mutation;
import com.apollographql.apollo3.api.Operation;
import com.apollographql.apollo3.api.Query;
import com.apollographql.apollo3.exception.ApolloHttpException;
import com.apollographql.apollo3.rx3.Rx3Apollo;
import com.saucelabs.visual.BuildConfig;
import com.saucelabs.visual.DataCenter;
import com.saucelabs.visual.exception.VisualApiException;

import io.reactivex.rxjava3.core.Single;

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
        ApolloCall<D> call = client.query(q);
        Single<ApolloResponse<D>> single = Rx3Apollo.single(call);
        try {
            ApolloResponse<D> response = single.blockingGet();
            return handleResponse(response);
        } catch (ApolloHttpException e) {
            throw new VisualApiException(e.getMessage());
        }
    }


    public <D extends Mutation.Data> D executeMutation(Mutation<D> m) {
        ApolloCall<D> call = client.mutation(m);
        Single<ApolloResponse<D>> single = Rx3Apollo.single(call);
        try {
            ApolloResponse<D> response = single.blockingGet();
            return handleResponse(response);
        } catch (ApolloHttpException e) {
            throw new VisualApiException(e.getMessage());
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
        } else {
            throw new VisualApiException("Unexpected GraphQL error");
        }
    }

}
