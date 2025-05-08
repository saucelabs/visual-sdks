package com.saucelabs.visual.model;

public class WindowScroll {
  private final int x;
  private final int y;

  public WindowScroll(int x, int y) {
    this.x = x;
    this.y = y;
  }

  public int getX() {
    return x;
  }

  public int getY() {
    return y;
  }
}
