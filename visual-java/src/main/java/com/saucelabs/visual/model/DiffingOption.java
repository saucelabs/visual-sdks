package com.saucelabs.visual.model;

import java.util.Arrays;
import java.util.List;

public class DiffingOption {
  public static final String Content = "content";
  public static final String Dimensions = "dimensions";
  public static final String Position = "position";
  public static final String Structure = "structure";
  public static final String Style = "style";
  public static final String Visual = "visual";

  public static final List<String> DiffingOptionValues =
      Arrays.asList(Content, Dimensions, Position, Structure, Style, Visual);
}
