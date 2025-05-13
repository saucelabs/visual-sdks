package com.saucelabs.visual.utils;

import java.util.Optional;
import org.openqa.selenium.Point;
import org.openqa.selenium.Rectangle;

public class CartesianHelpers {
  public static Rectangle relativeTo(Point origin, Rectangle rectangle) {
    int newX = rectangle.x - origin.x;
    int newY = rectangle.y - origin.y;
    return new Rectangle(new Point(newX, newY), rectangle.getDimension());
  }

  public static Point relativeTo(Point origin, Point point) {
    int newX = point.x - origin.x;
    int newY = point.y - origin.y;
    return new Point(newX, newY);
  }

  public static Optional<Rectangle> intersect(Rectangle r1, Rectangle r2) {
    int x1 = Math.max(r1.x, r2.x);
    int y1 = Math.max(r1.y, r2.y);
    int x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
    int y2 = Math.min(r1.y + r1.height, r2.y + r2.height);

    int width = x2 - x1;
    int height = y2 - y1;

    if (width <= 0 || height <= 0) {
      return Optional.empty();
    }

    return Optional.of(new Rectangle(x1, y1, height, width));
  }
}
