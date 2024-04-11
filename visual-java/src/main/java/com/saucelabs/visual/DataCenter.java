package com.saucelabs.visual;

public enum DataCenter {
  US_WEST_1("https://api.us-west-1.saucelabs.com/v1/visual/graphql"),
  US_EAST_4("https://api.us-east-4.saucelabs.com/v1/visual/graphql"),
  EU_CENTRAL_1("https://api.eu-central-1.saucelabs.com/v1/visual/graphql");

  public final String endpoint;

  DataCenter(String endpoint) {
    this.endpoint = endpoint;
  }
}
