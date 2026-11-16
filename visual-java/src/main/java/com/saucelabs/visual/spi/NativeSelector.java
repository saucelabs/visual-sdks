package com.saucelabs.visual.spi;

import java.util.Objects;

/** An element selector understood by native app sessions. */
public final class NativeSelector {

  /** Selector strategies. */
  public enum Type {
    XPATH
  }

  private final Type type;
  private final String value;

  public NativeSelector(Type type, String value) {
    this.type = Objects.requireNonNull(type, "type");
    this.value = Objects.requireNonNull(value, "value");
  }

  public static NativeSelector xpath(String value) {
    return new NativeSelector(Type.XPATH, value);
  }

  public Type getType() {
    return type;
  }

  public String getValue() {
    return value;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof NativeSelector)) return false;
    NativeSelector that = (NativeSelector) o;
    return type == that.type && value.equals(that.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(type, value);
  }

  @Override
  public String toString() {
    return type + "(" + value + ")";
  }
}
