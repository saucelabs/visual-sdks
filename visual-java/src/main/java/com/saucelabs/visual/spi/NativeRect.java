package com.saucelabs.visual.spi;

/**
 * A rectangle in logical (point / dp) coordinates. Values are doubles so implementations don't lose
 * precision; the SDK rounds them when needed.
 */
public final class NativeRect {
  private final double x;
  private final double y;
  private final double width;
  private final double height;

  public NativeRect(double x, double y, double width, double height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public double getX() {
    return x;
  }

  public double getY() {
    return y;
  }

  public double getWidth() {
    return width;
  }

  public double getHeight() {
    return height;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof NativeRect)) return false;
    NativeRect r = (NativeRect) o;
    return Double.compare(x, r.x) == 0
        && Double.compare(y, r.y) == 0
        && Double.compare(width, r.width) == 0
        && Double.compare(height, r.height) == 0;
  }

  @Override
  public int hashCode() {
    return java.util.Objects.hash(x, y, width, height);
  }

  @Override
  public String toString() {
    return "NativeRect{x=" + x + ", y=" + y + ", width=" + width + ", height=" + height + "}";
  }
}
