package com.saucelabs.visual.exception;

import com.saucelabs.visual.graphql.type.IgnoreSelectorIn;

public class InvalidIgnoreSelectorException extends VisualApiException {
  private final IgnoreSelectorIn ignoreSelectorIn;

  public InvalidIgnoreSelectorException(IgnoreSelectorIn selector, String message) {
    super(message);
    this.ignoreSelectorIn = selector;
  }

  public IgnoreSelectorIn getIgnoreSelectorIn() {
    return ignoreSelectorIn;
  }
}
