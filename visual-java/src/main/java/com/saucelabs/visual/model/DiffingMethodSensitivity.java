package com.saucelabs.visual.model;

public enum DiffingMethodSensitivity {
  Low,
  Balanced,
  High;

  public com.saucelabs.visual.graphql.type.DiffingMethodSensitivity asGraphQLType() {
    switch (this) {
      case Low:
        return com.saucelabs.visual.graphql.type.DiffingMethodSensitivity.Low;
      default:
      case Balanced:
        return com.saucelabs.visual.graphql.type.DiffingMethodSensitivity.Balanced;
      case High:
        return com.saucelabs.visual.graphql.type.DiffingMethodSensitivity.High;
    }
  }
}
