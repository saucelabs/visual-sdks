package com.saucelabs.visual.model;

import com.saucelabs.visual.graphql.type.DiffingOptionsIn;

public enum DiffingFlag {
  Content(1 << 0),
  Dimensions(1 << 1),
  Position(1 << 2),
  Structure(1 << 3),
  Style(1 << 4),
  Visual(1 << 5);

  private final long value;

  DiffingFlag(long value) {
    this.value = value;
  }

  public long getValue() {
    return value;
  }

  public void apply(DiffingOptionsIn options, boolean value) {
    if (0 < (this.value & Content.value)) options.setContent(value);
    if (0 < (this.value & Dimensions.value)) options.setDimensions(value);
    if (0 < (this.value & Position.value)) options.setPosition(value);
    if (0 < (this.value & Structure.value)) options.setStructure(value);
    if (0 < (this.value & Style.value)) options.setStyle(value);
    if (0 < (this.value & Visual.value)) options.setVisual(value);
  }

  public static void setAll(DiffingOptionsIn options, boolean value) {
    for (DiffingFlag o : DiffingFlag.values()) {
      o.apply(options, value);
    }
  }
}
