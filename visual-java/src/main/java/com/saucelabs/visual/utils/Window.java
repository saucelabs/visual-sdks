package com.saucelabs.visual.utils;

import java.util.Collections;
import java.util.List;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Point;
import org.openqa.selenium.Rectangle;
import org.openqa.selenium.UnsupportedCommandException;
import org.openqa.selenium.WebElement;

public class Window {
  private final JavascriptExecutor driver;

  public Window(JavascriptExecutor javascriptExecutor) {
    this.driver = javascriptExecutor;
  }

  /**
   * Returns the current scroll offset and viewport size. Falls back to an empty rectangle on
   * sessions that don't support JS execution (e.g. mobile browsers automated through Appium), since
   * there's no WebDriver-native equivalent for scroll position.
   */
  public Rectangle getViewport() {
    try {
      Object result = driver.executeScript(jsViewportTupleSnippet);
      return convertJsTupleToRectangle(result);
    } catch (UnsupportedCommandException e) {
      return new Rectangle(0, 0, 0, 0);
    }
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

  /** Id of the style tag injected into the page to hide elements overlapping the clip element. */
  public static final String HIDE_OVERLAPPING_STYLE_ID = "sauce-visual-hide-overlapping";

  /** Attribute applied to elements hidden by hideElementsOverlapping. */
  public static final String HIDE_OVERLAPPING_ATTRIBUTE = "data-sauce-visual-hidden";

  /**
   * Hit tests the given element and hides every element painted on top of it, so that the clipped
   * screenshot shows the element itself rather than e.g. a sticky header, cookie banner or tooltip
   * covering it. This happens in a single round trip:
   *
   * <ul>
   *   <li>Elements on top of the target are found purely by hit testing:
   *       document.elementsFromPoint() at an evenly spaced grid of points spanning the target edge
   *       to edge (at most ~10k points, at least 4px apart), with pointer-events temporarily forced
   *       on so that pointer-events: none overlays are found too. Only elements before the target
   *       in the hit-test stack (i.e. painted above it) are collected, never its ancestors or
   *       descendants. Overlays thinner than the grid spacing can slip between points.
   *   <li>The results are deduplicated to their outermost element, then lifted to a common parent
   *       when every child of that parent is hidden and the parent's own box doesn't touch the
   *       target, so only a few elements get marked.
   *   <li>A style tag with id {@value #HIDE_OVERLAPPING_STYLE_ID} hides every element marked with
   *       {@value #HIDE_OVERLAPPING_ATTRIBUTE} (and its descendants) with visibility: hidden, which
   *       doesn't change the page layout.
   * </ul>
   *
   * <p>When fullPage is true, the window is scrolled across the whole target to hit test parts
   * outside the viewport, then the original scroll position is restored. Call
   * restoreHiddenElements() afterward to undo every change made to the page.
   *
   * @param element the element to uncover
   * @param fullPage whether the whole element will be captured, rather than only the part visible
   *     in the viewport
   */
  public void hideElementsOverlapping(WebElement element, boolean fullPage) {
    if (element == null) {
      return;
    }
    driver.executeScript(
        jsHideOverlappingSnippet,
        element,
        fullPage,
        HIDE_OVERLAPPING_STYLE_ID,
        HIDE_OVERLAPPING_ATTRIBUTE);
  }

  /**
   * Undo hideElementsOverlapping: removes the hidden attribute from every marked element and
   * deletes the injected style tag. Safe to call when nothing has been hidden.
   */
  public void restoreHiddenElements() {
    driver.executeScript(
        jsRestoreHiddenSnippet, HIDE_OVERLAPPING_STYLE_ID, HIDE_OVERLAPPING_ATTRIBUTE);
  }

  private static final String jsRestoreHiddenSnippet =
      "const [styleId, attr] = arguments;\n"
          + "document.querySelectorAll('[' + attr + ']').forEach((el) => el.removeAttribute(attr));\n"
          + "const style = document.getElementById(styleId);\n"
          + "if (style) style.remove();";

  private static final String jsHideOverlappingSnippet =
      "const [target, fullPage, styleId, attr] = arguments;\n"
          // clear out anything left behind by a previous check that never got cleaned up
          + "document.querySelectorAll('[' + attr + ']').forEach((el) => el.removeAttribute(attr));\n"
          + "const stale = document.getElementById(styleId);\n"
          + "if (stale) stale.remove();\n"
          // upper bound on hit-test points per viewport; the grid spacing grows for large targets
          + "const MAX_GRID_POINTS = 10000;\n"
          + "const MIN_GRID_STEP = 4;\n"
          + "const MAX_SCROLL_STEPS = 100;\n"
          + "const style = document.createElement('style');\n"
          + "style.id = styleId;\n"
          // make everything hit-testable during the scan so pointer-events: none overlays count
          + "style.textContent = '* { pointer-events: auto !important; }';\n"
          + "(document.head || document.documentElement).appendChild(style);\n"
          + "const isTargetOrChild = (el) => el === target || target.contains(el);\n"
          + "const occluders = new Set();\n"
          + "const scanViewport = () => {\n"
          + "  const vw = document.documentElement.clientWidth || window.innerWidth;\n"
          + "  const vh = document.documentElement.clientHeight || window.innerHeight;\n"
          + "  const t = target.getBoundingClientRect();\n"
          + "  const left = Math.max(t.left, 0), top = Math.max(t.top, 0);\n"
          + "  const right = Math.min(t.right, vw), bottom = Math.min(t.bottom, vh);\n"
          + "  if (right <= left || bottom <= top) return;\n"
          // evenly spaced points spanning the visible part of the target edge to edge (inset half a
          // pixel so edge points still land inside it)
          + "  const w = right - left, h = bottom - top;\n"
          + "  const step = Math.max(MIN_GRID_STEP, Math.sqrt((w * h) / MAX_GRID_POINTS));\n"
          + "  const axis = (start, size) => {\n"
          + "    const n = Math.max(1, Math.ceil(size / step) + 1);\n"
          + "    if (n === 1 || size <= 1) return [start + size / 2];\n"
          + "    return Array.from({length: n}, (_, i) => start + 0.5 + (i * (size - 1)) / (n - 1));\n"
          + "  };\n"
          + "  const xs = axis(left, w);\n"
          + "  for (const y of axis(top, h)) for (const x of xs) {\n"
          + "    const stack = document.elementsFromPoint(x, y);\n"
          // everything before the last target-or-descendant entry is painted above the target.
          // if the target isn't in the stack at all (e.g. a rounded corner) we can't tell what's
          // above vs below it, so skip the point.
          + "    let last = -1;\n"
          + "    for (let j = stack.length - 1; j >= 0; j--) {\n"
          + "      if (isTargetOrChild(stack[j])) { last = j; break; }\n"
          + "    }\n"
          + "    for (let j = 0; j < last; j++) {\n"
          + "      const el = stack[j];\n"
          + "      if (!isTargetOrChild(el) && !el.contains(target)) occluders.add(el);\n"
          + "    }\n"
          + "  }\n"
          + "};\n"
          + "try {\n"
          + "  if (fullPage) {\n"
          + "    const startX = window.scrollX, startY = window.scrollY;\n"
          + "    const vw = Math.max(1, document.documentElement.clientWidth || window.innerWidth);\n"
          + "    const vh = Math.max(1, document.documentElement.clientHeight || window.innerHeight);\n"
          + "    const t = target.getBoundingClientRect();\n"
          + "    const docLeft = t.left + startX, docTop = t.top + startY;\n"
          + "    let steps = 0;\n"
          + "    for (let y = docTop; y < docTop + t.height && steps < MAX_SCROLL_STEPS; y += vh) {\n"
          + "      for (let x = docLeft; x < docLeft + t.width && steps < MAX_SCROLL_STEPS; x += vw) {\n"
          + "        window.scrollTo({left: x, top: y, behavior: 'instant'});\n"
          + "        scanViewport();\n"
          + "        steps++;\n"
          + "      }\n"
          + "    }\n"
          + "    window.scrollTo({left: startX, top: startY, behavior: 'instant'});\n"
          + "  } else {\n"
          + "    scanViewport();\n"
          + "  }\n"
          // keep only the outermost elements - hiding a parent hides its children too
          + "  let roots = new Set([...occluders].filter((el) => {\n"
          + "    for (let p = el.parentElement; p; p = p.parentElement) if (occluders.has(p)) return false;\n"
          + "    return true;\n"
          + "  }));\n"
          // lift to a common parent when every child of the parent is hidden, the parent's own box
          // doesn't touch the target and it has no text of its own - hiding it then changes nothing
          // else inside the clipped area.
          + "  const t = target.getBoundingClientRect();\n"
          + "  const touchesTarget = (r) =>\n"
          + "    r.left < t.right && r.right > t.left && r.top < t.bottom && r.bottom > t.top;\n"
          + "  const hasOwnText = (el) => [...el.childNodes].some(\n"
          + "    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== '');\n"
          + "  let changed = true;\n"
          + "  while (changed) {\n"
          + "    changed = false;\n"
          + "    const parents = new Set([...roots].map((el) => el.parentElement));\n"
          + "    for (const p of parents) {\n"
          + "      if (!p || p === document.body || p === document.documentElement) continue;\n"
          + "      if (p.contains(target) || hasOwnText(p)) continue;\n"
          + "      if (![...p.children].every((c) => roots.has(c))) continue;\n"
          + "      if (touchesTarget(p.getBoundingClientRect())) continue;\n"
          + "      for (const c of p.children) roots.delete(c);\n"
          + "      roots.add(p);\n"
          + "      changed = true;\n"
          + "    }\n"
          + "  }\n"
          + "  style.textContent = '[' + attr + '], [' + attr + '] * { visibility: hidden !important; transition: none !important; }';\n"
          + "  roots.forEach((el) => el.setAttribute(attr, ''));\n"
          + "  return roots.size;\n"
          + "} catch (e) {\n"
          + "  style.remove();\n"
          + "  document.querySelectorAll('[' + attr + ']').forEach((el) => el.removeAttribute(attr));\n"
          + "  throw e;\n"
          + "}";

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
