package com.saucelabs.visual;

import org.junit.Test;

public class SmokeTest {

    @Test
    public void check() {
        VisualClient visual = new VisualClient("Espresso smoke test");
        visual.sauceVisualCheck("snap");
    }
}
