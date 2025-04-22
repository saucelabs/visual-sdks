package com.saucelabs.visual.model;

public enum DiffingMethodSensitivity {
  LOW,
  BALANCED,
  HIGH;

  public com.saucelabs.visual.graphql.type.DiffingMethodSensitivity asGraphQLType() {
    switch (this) {
      case LOW:
        return com.saucelabs.visual.graphql.type.DiffingMethodSensitivity.LOW;
      default:
      case BALANCED:
        return com.saucelabs.visual.graphql.type.DiffingMethodSensitivity.BALANCED;
      case HIGH:
        return com.saucelabs.visual.graphql.type.DiffingMethodSensitivity.HIGH;
    }
  }
}
