package com.saucelabs.visual.model;

import java.util.Objects;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Class to have state variables function like JS for use with GraphQL fields which can be set,
 * unset (js undefined - omitted from the request), or explicitly `null`.
 */
public class JSOptional<T> {
  private enum State {
    UNSET,
    NULL,
    VALUE
  }

  private final State state;
  private final T value;

  private JSOptional(State state, T value) {
    this.state = state;
    this.value = value;
  }

  public static <T> JSOptional<T> unset() {
    return new JSOptional<>(State.UNSET, null);
  }

  public static <T> JSOptional<T> ofNull() {
    return new JSOptional<>(State.NULL, null);
  }

  public static <T> JSOptional<T> of(T value) {
    return new JSOptional<>(State.VALUE, Objects.requireNonNull(value));
  }

  public static <T> JSOptional<T> ofNullable(T value) {
    return value == null ? ofNull() : of(value);
  }

  public boolean isSet() {
    return state != State.UNSET;
  }

  public boolean isNull() {
    return state == State.NULL;
  }

  public T orElse(T other) {
    return state == State.VALUE ? value : other;
  }

  public <U> JSOptional<U> map(Function<T, U> fn) {
    if (state == State.VALUE) {
      return JSOptional.of(fn.apply(value));
    }
    return new JSOptional<>(state, null);
  }

  /**
   * If value is present, invokes the consumer with an Optional representing the value. Allows use
   * with Optional-based APIs.
   */
  public void ifSet(Consumer<Optional<T>> action) {
    if (state != State.UNSET) {
      action.accept(state == State.VALUE ? Optional.of(value) : Optional.empty());
    }
  }
}
