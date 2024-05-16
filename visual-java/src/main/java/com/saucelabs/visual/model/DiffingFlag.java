package com.saucelabs.visual.model;

import com.saucelabs.visual.graphql.type.DiffingOptionsIn;

public enum DiffingFlag {
  Content,
  Dimensions,
  Position,
  Structure,
  Style,
  Visual;

  public void apply(DiffingOptionsIn options, boolean value) {
    if (this == Content) options.setContent(value);
    if (this == Dimensions) options.setDimensions(value);
    if (this == Position) options.setPosition(value);
    if (this == Structure) options.setStructure(value);
    if (this == Style) options.setStyle(value);
    if (this == Visual) options.setVisual(value);
  }

  public static void setAll(DiffingOptionsIn options, boolean value) {
    for (DiffingFlag o : DiffingFlag.values()) {
      o.apply(options, value);
    }
  }
}
