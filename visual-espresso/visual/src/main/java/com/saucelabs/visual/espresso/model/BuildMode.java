package com.saucelabs.visual.espresso.model;

public enum BuildMode {
    RUNNING("RUNNING"),
    ERRORED("ERRORED");

    private final String mode;

    BuildMode(String mode) {
        this.mode = mode;
    }
}
