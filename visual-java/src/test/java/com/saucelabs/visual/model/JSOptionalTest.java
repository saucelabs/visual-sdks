package com.saucelabs.visual.model;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class JSOptionalTest {

  @Test
  void unsetState() {
    JSOptional<String> opt = JSOptional.unset();
    assertTrue(opt.isUnset());
    assertFalse(opt.isNull());
    assertFalse(opt.isSet());
  }

  @Test
  void nullState() {
    JSOptional<String> opt = JSOptional.ofNull();
    assertTrue(opt.isNull());
    assertTrue(opt.isSet());
    assertFalse(opt.isUnset());
  }

  @Test
  void valueState() {
    JSOptional<String> opt = JSOptional.of("hello");
    assertTrue(opt.isSet());
    assertFalse(opt.isNull());
    assertFalse(opt.isUnset());
  }

  @Test
  void ofRejectsNull() {
    assertThrows(NullPointerException.class, () -> JSOptional.of(null));
  }

  @Test
  void ofNullableWithValue() {
    JSOptional<String> opt = JSOptional.ofNullable("hello");
    assertTrue(opt.isSet());
    assertFalse(opt.isNull());
    assertEquals("hello", opt.orElse("fallback"));
  }

  @Test
  void ofNullableWithNull() {
    JSOptional<String> opt = JSOptional.ofNullable(null);
    assertTrue(opt.isNull());
    assertTrue(opt.isSet());
  }

  @Test
  void orElseReturnsValueWhenPresent() {
    JSOptional<String> opt = JSOptional.of("hello");
    assertEquals("hello", opt.orElse("fallback"));
  }

  @Test
  void orElseReturnsFallbackWhenNull() {
    JSOptional<String> opt = JSOptional.ofNull();
    assertEquals("fallback", opt.orElse("fallback"));
  }

  @Test
  void orElseReturnsFallbackWhenUnset() {
    JSOptional<String> opt = JSOptional.unset();
    assertEquals("fallback", opt.orElse("fallback"));
  }

  @Test
  void mapTransformsValue() {
    JSOptional<String> opt = JSOptional.of("hello");
    JSOptional<Integer> mapped = opt.map(String::length);
    assertTrue(mapped.isSet());
    assertFalse(mapped.isNull());
    assertEquals(5, mapped.orElse(0));
  }

  @Test
  void mapPreservesNullState() {
    JSOptional<String> opt = JSOptional.ofNull();
    JSOptional<Integer> mapped = opt.map(String::length);
    assertTrue(mapped.isNull());
    assertTrue(mapped.isSet());
  }

  @Test
  void mapPreservesUnsetState() {
    JSOptional<String> opt = JSOptional.unset();
    JSOptional<Integer> mapped = opt.map(String::length);
    assertTrue(mapped.isUnset());
    assertFalse(mapped.isSet());
  }

  @Test
  void ifSetCalledWhenValuePresent() {
    JSOptional<String> opt = JSOptional.of("hello");
    AtomicReference<Optional<String>> captured = new AtomicReference<>();
    opt.ifSet(captured::set);
    assertEquals(Optional.of("hello"), captured.get());
  }

  @Test
  void ifSetCalledWithEmptyOptionalWhenNull() {
    JSOptional<String> opt = JSOptional.ofNull();
    AtomicReference<Optional<String>> captured = new AtomicReference<>();
    opt.ifSet(captured::set);
    assertEquals(Optional.empty(), captured.get());
  }

  @Test
  void ifSetNotCalledWhenUnset() {
    JSOptional<String> opt = JSOptional.unset();
    AtomicReference<Optional<String>> captured = new AtomicReference<>();
    opt.ifSet(captured::set);
    assertNull(captured.get());
  }
}
