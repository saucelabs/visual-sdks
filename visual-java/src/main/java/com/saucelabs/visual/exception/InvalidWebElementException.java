package com.saucelabs.visual.exception;

import org.openqa.selenium.WebElement;

public class InvalidWebElementException extends VisualApiException {
  private final WebElement webElement;

  public InvalidWebElementException(WebElement webElement, String message) {
    super(message);
    this.webElement = webElement;
  }

  public WebElement getWebElement() {
    return webElement;
  }
}
