package com.saucelabs.visual.utils;

import java.util.Collections;
import java.util.List;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Point;
import org.openqa.selenium.Rectangle;
import org.openqa.selenium.WebElement;

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
            String.format(
                    "window.scrollTo({left: %d, top: %d, behavior: 'instant'});", point.x, point.y)
                + jsViewportTupleSnippet);
    return convertJsTupleToRectangle(result);
  }

  /**
   * Capture the scroll offsets of every scrollable ancestor of the given element, so they can be
   * restored after an operation that may scroll them (e.g. scrollIntoView). The window scroll
   * position is tracked separately via getViewport() / scrollTo().
   *
   * @param element the element whose scrollable ancestors should be captured; may be null
   * @return opaque scroll state to pass to restoreNestedScrollState
   */
  public List<?> saveNestedScrollState(WebElement element) {
    if (element == null) {
      return Collections.emptyList();
    }
    Object result = driver.executeScript(jsSaveNestedScrollSnippet, element);
    return result instanceof List<?> ? (List<?>) result : Collections.emptyList();
  }

  /**
   * Restore the scroll offsets previously captured with saveNestedScrollState.
   *
   * @param state the state returned by saveNestedScrollState
   */
  public void restoreNestedScrollState(List<?> state) {
    if (state == null || state.isEmpty()) {
      return;
    }
    driver.executeScript(jsRestoreNestedScrollSnippet, state);
  }

  private final String jsSaveNestedScrollSnippet =
      "const [element] = arguments;\n"
          + "const saved = [];\n"
          + "let el = element ? element.parentElement : null;\n"
          + "while (el && el !== document.documentElement && el !== document.body) {\n"
          + "  if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {\n"
          + "    saved.push([el, el.scrollTop, el.scrollLeft]);\n"
          + "  }\n"
          + "  el = el.parentElement;\n"
          + "}\n"
          + "return saved;";

  // scrollTo with behavior 'instant' because plain scrollTop assignment respects
  // `scroll-behavior: smooth` and would race the user's next command
  private final String jsRestoreNestedScrollSnippet =
      "const saved = arguments[0];\n"
          + "for (const entry of saved) {\n"
          + "  if (!entry[0]) continue;\n"
          + "  entry[0].scrollTo({top: entry[1], left: entry[2], behavior: 'instant'});\n"
          + "}";

  private final String jsViewportTupleSnippet =
      "return [Math.round(window.scrollX), Math.round(window.scrollY), Math.round(window.innerWidth), Math.round(window.innerHeight)];";

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
