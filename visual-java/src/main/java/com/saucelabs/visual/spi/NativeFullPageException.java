package com.saucelabs.visual.spi;

/** Thrown by a {@link NativeFullPageCapturer} when a full-page capture fails. */
public class NativeFullPageException extends RuntimeException {

  public NativeFullPageException(String message) {
    super(message);
  }

  public NativeFullPageException(String message, Throwable cause) {
    super(message, cause);
  }
}
