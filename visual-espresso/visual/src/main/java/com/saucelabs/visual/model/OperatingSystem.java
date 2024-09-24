package com.saucelabs.visual.model;

public enum OperatingSystem {
    ANDROID("ANDROID"),
    IOS("IOS"),
    LINUX("LINUX"),
    MACOS("MACOS"),
    WINDOWS("WINDOWS");

    private final String operatingSystem;

    OperatingSystem(String operatingSystem) {
        this.operatingSystem = operatingSystem;
    }
}