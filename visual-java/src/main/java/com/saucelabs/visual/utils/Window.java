package com.saucelabs.visual.utils;

import java.util.List;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Point;
import org.openqa.selenium.Rectangle;

public class Window {
  private final JavascriptExecutor driver;

  public Window(JavascriptExecutor javascriptExecutor) {
    this.driver = javascriptExecutor;
  }

  public Rectangle getViewport() {
    Object result = driver.executeScript(jsViewportTupleSnippet);
    return convertJsTupleToRectangle(result);
  }

  public Rectangle scrollTo(Point point) {
    Object result =
        driver.executeScript(
            String.format("window.scrollTo(%d, %d);", point.x, point.y) + jsViewportTupleSnippet);
    return convertJsTupleToRectangle(result);
  }

  private final String jsViewportTupleSnippet =
      "return [window.scrollX, window.scrollY, window.innerWidth, window.innerHeight];";

  private Rectangle convertJsTupleToRectangle(Object result) {
    if (!(result instanceof List<?>)) {
      return new Rectangle(0, 0, 0, 0);
    }

    List<?> list = (List<?>) result;
    Object rawScrollX = list.get(0);
    Object rawScrollY = list.get(1);
    Object rawWidth = list.get(2);
    Object rawHeight = list.get(3);

    int scrollX = rawScrollX instanceof Long ? ((Long) rawScrollX).intValue() : 0;
    int scrollY = rawScrollY instanceof Long ? ((Long) rawScrollY).intValue() : 0;
    int width = rawWidth instanceof Long ? ((Long) rawWidth).intValue() : 0;
    int height = rawHeight instanceof Long ? ((Long) rawHeight).intValue() : 0;

    return new Rectangle(scrollX, scrollY, height, width);
  }
}
