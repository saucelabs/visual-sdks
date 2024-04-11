package com.saucelabs.visual.utils;

public class ConsoleColors {
  private static final String RESET = "\033[0m";

  // Colors
  private static final String GREY = "\033[90m";
  private static final String YELLOW = "\033[33m";

  // Styling
  private static final String BOLD = "\033[1m";
  private static final String ITALIC = "\033[3m";

  public static final String Grey(String text) {
    return String.format("%s%s%s", GREY, text, RESET);
  }

  public static final String Yellow(String text) {
    return String.format("%s%s%s", YELLOW, text, RESET);
  }

  public static final String Italic(String text) {
    return String.format("%s%s%s", ITALIC, text, RESET);
  }

  public static final String Bold(String text) {
    return String.format("%s%s%s", BOLD, text, RESET);
  }
}
