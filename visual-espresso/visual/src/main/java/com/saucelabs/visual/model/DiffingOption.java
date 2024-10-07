package com.saucelabs.visual.model;

import com.saucelabs.visual.graphql.type.DiffingOptionsIn;

public enum DiffingOption {
    CONTENT,
    DIMENSIONS,
    POSITION,
    STRUCTURE,
    STYLE,
    VISUAL;

    public void apply(DiffingOptionsIn.Builder builder, boolean value) {
        if (this == CONTENT) {
            builder.content(value);
        }
        if (this == DIMENSIONS) {
            builder.dimensions(value);
        }
        if (this == POSITION) {
            builder.position(value);
        }
        if (this == STRUCTURE) {
            builder.structure(value);
        }
        if (this == STYLE) {
            builder.style(value);
        }
        if (this == VISUAL) {
            builder.visual(value);
        }
    }
}


