package com.saucelabs.visual.exception;

import com.saucelabs.visual.model.VisualRegion;

public class InvalidVisualRegionException extends VisualApiException {
  private final VisualRegion visualRegion;

  public InvalidVisualRegionException(VisualRegion visualRegion, String message) {
    super(message);
    this.visualRegion = visualRegion;
  }

  public VisualRegion getVisualRegion() {
    return visualRegion;
  }
}
