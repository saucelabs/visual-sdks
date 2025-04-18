package com.saucelabs.visual.model;

import com.saucelabs.visual.graphql.type.DiffingMethodToleranceIn;

public class DiffingMethodTolerance {
  private Integer minChangeSize;
  private Double brightness;
  private Double color;
  private Double antiAliasing;

  public Integer getMinChangeSize() {
    return minChangeSize;
  }

  public void setMinChangeSize(Integer minChangeSize) {
    this.minChangeSize = minChangeSize;
  }

  public Double getBrightness() {
    return brightness;
  }

  public void setBrightness(Double brightness) {
    this.brightness = brightness;
  }

  public Double getColor() {
    return color;
  }

  public void setColor(Double color) {
    this.color = color;
  }

  public Double getAntiAliasing() {
    return antiAliasing;
  }

  public void setAntiAliasing(Double antiAliasing) {
    this.antiAliasing = antiAliasing;
  }

  private DiffingMethodTolerance(Builder builder) {
    this.minChangeSize = builder.minChangeSize;
    this.brightness = builder.brightness;
    this.color = builder.color;
    this.antiAliasing = builder.antiAliasing;
  }

  public DiffingMethodToleranceIn asGraphQLType() {
    DiffingMethodToleranceIn tolerance = new DiffingMethodToleranceIn();
    tolerance.setAntiAliasing(this.antiAliasing);
    tolerance.setBrightness(this.brightness);
    tolerance.setColor(this.color);
    tolerance.setMinChangeSize(this.minChangeSize);
    return tolerance;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private Integer minChangeSize;
    private Double brightness;
    private Double color;
    private Double antiAliasing;

    public Builder withMinChangeSize(Integer minChangeSize) {
      this.minChangeSize = minChangeSize;
      return this;
    }

    public Builder withBrightness(Double brightness) {
      this.brightness = brightness;
      return this;
    }

    public Builder withColor(Double color) {
      this.color = color;
      return this;
    }

    public Builder withAntiAliasing(Double antiAliasing) {
      this.antiAliasing = antiAliasing;
      return this;
    }

    public DiffingMethodTolerance build() {
      return new DiffingMethodTolerance(this);
    }
  }
}
