package com.saucelabs.visual.graphql;

import java.util.Map;

public interface GraphQLOperation {
    String getQuery();

    Map<String, Object> getVariables();
}
