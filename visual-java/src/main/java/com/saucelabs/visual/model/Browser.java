package com.saucelabs.visual.model;

public enum Browser {
  CHROME,
  EDGE,
  FIREFOX,
  FIGMA,
  NONE,
  PLAYWRIGHT_WEBKIT,
  SAFARI;

  public com.saucelabs.visual.graphql.type.Browser asGraphQLType() {
    switch (this) {
      case CHROME:
        return com.saucelabs.visual.graphql.type.Browser.CHROME;
      case EDGE:
        return com.saucelabs.visual.graphql.type.Browser.EDGE;
      case FIGMA:
        return com.saucelabs.visual.graphql.type.Browser.FIGMA;
      case FIREFOX:
        return com.saucelabs.visual.graphql.type.Browser.FIREFOX;
      case NONE:
        return com.saucelabs.visual.graphql.type.Browser.NONE;
      case PLAYWRIGHT_WEBKIT:
        return com.saucelabs.visual.graphql.type.Browser.PLAYWRIGHT_WEBKIT;
      case SAFARI:
        return com.saucelabs.visual.graphql.type.Browser.SAFARI;
    }
    return null;
  }
}
