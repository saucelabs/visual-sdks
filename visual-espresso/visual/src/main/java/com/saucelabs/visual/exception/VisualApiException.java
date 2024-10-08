package com.saucelabs.visual.exception;

public class VisualApiException extends RuntimeException {

    public VisualApiException(String msg) {
        super(msg);
    }

    public VisualApiException(String msg, Exception e) {
        super(msg, e);
    }
}
