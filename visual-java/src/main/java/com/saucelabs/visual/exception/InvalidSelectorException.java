package com.saucelabs.visual.exception;

import com.saucelabs.visual.graphql.type.SelectorIn;

public class InvalidSelectorException extends VisualApiException {
  private final SelectorIn selectorIn;

  public InvalidSelectorException(SelectorIn selector, String message) {
    super(message);
    this.selectorIn = selector;
  }

  public SelectorIn getSelectorIn() {
    return selectorIn;
  }
}
