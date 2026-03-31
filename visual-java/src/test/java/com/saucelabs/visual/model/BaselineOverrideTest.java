package com.saucelabs.visual.model;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class BaselineOverrideTest {

  @Test
  void fieldsAreNullAndUnsetByDefault() {
    BaselineOverride override = new BaselineOverride();
    assertNull(override.getName());
    assertNull(override.getBrowser());
    assertNull(override.getDevice());
    assertNull(override.getOperatingSystem());
    assertNull(override.getBrowserVersion());
    assertNull(override.getOperatingSystemVersion());
    assertNull(override.getSuiteName());
    assertNull(override.getTestName());

    assertFalse(override.hasName());
    assertFalse(override.hasBrowser());
    assertFalse(override.hasDevice());
    assertFalse(override.hasOperatingSystem());
    assertFalse(override.hasBrowserVersion());
    assertFalse(override.hasOperatingSystemVersion());
    assertFalse(override.hasSuiteName());
    assertFalse(override.hasTestName());
  }

  @Test
  void setFieldsViaSetter() {
    BaselineOverride override = new BaselineOverride();
    override.setName("snap");
    override.setBrowser(Browser.CHROME);
    override.setDevice("Pixel 8");
    override.setOperatingSystem(OperatingSystem.ANDROID);
    override.setBrowserVersion("120");
    override.setOperatingSystemVersion("14");
    override.setSuiteName("suite");
    override.setTestName("test");

    assertEquals("snap", override.getName());
    assertEquals(Browser.CHROME, override.getBrowser());
    assertEquals("Pixel 8", override.getDevice());
    assertEquals(OperatingSystem.ANDROID, override.getOperatingSystem());
    assertEquals("120", override.getBrowserVersion());
    assertEquals("14", override.getOperatingSystemVersion());
    assertEquals("suite", override.getSuiteName());
    assertEquals("test", override.getTestName());
  }

  @Test
  void overwriteFieldReplacesValue() {
    BaselineOverride override = new BaselineOverride();
    override.setName("first");
    override.setName("second");
    assertEquals("second", override.getName());
  }

  @Test
  void setNullExplicitly() {
    BaselineOverride override = new BaselineOverride();
    override.setName("snap");
    override.setName(null);
    assertNull(override.getName());
    assertTrue(override.hasName());
  }

  @Test
  void hasReturnsTrueWhenSet() {
    BaselineOverride override = new BaselineOverride();
    override.setName("snap");
    override.setBrowser(Browser.CHROME);
    override.setDevice("Pixel 8");
    override.setOperatingSystem(OperatingSystem.ANDROID);
    override.setBrowserVersion("120");
    override.setOperatingSystemVersion("14");
    override.setSuiteName("suite");
    override.setTestName("test");

    assertTrue(override.hasName());
    assertTrue(override.hasBrowser());
    assertTrue(override.hasDevice());
    assertTrue(override.hasOperatingSystem());
    assertTrue(override.hasBrowserVersion());
    assertTrue(override.hasOperatingSystemVersion());
    assertTrue(override.hasSuiteName());
    assertTrue(override.hasTestName());
  }

  @Test
  void clearResetsFieldToUnset() {
    BaselineOverride override = new BaselineOverride();
    override.setName("snap");
    override.setBrowser(Browser.CHROME);
    override.setDevice("Pixel 8");
    override.setOperatingSystem(OperatingSystem.ANDROID);
    override.setBrowserVersion("120");
    override.setOperatingSystemVersion("14");
    override.setSuiteName("suite");
    override.setTestName("test");

    override.clearName();
    override.clearBrowser();
    override.clearDevice();
    override.clearOperatingSystem();
    override.clearBrowserVersion();
    override.clearOperatingSystemVersion();
    override.clearSuiteName();
    override.clearTestName();

    assertNull(override.getName());
    assertNull(override.getBrowser());
    assertNull(override.getDevice());
    assertNull(override.getOperatingSystem());
    assertNull(override.getBrowserVersion());
    assertNull(override.getOperatingSystemVersion());
    assertNull(override.getSuiteName());
    assertNull(override.getTestName());

    assertFalse(override.hasName());
    assertFalse(override.hasBrowser());
    assertFalse(override.hasDevice());
    assertFalse(override.hasOperatingSystem());
    assertFalse(override.hasBrowserVersion());
    assertFalse(override.hasOperatingSystemVersion());
    assertFalse(override.hasSuiteName());
    assertFalse(override.hasTestName());
  }

  @Test
  void clearAfterNullResetsToUnset() {
    BaselineOverride override = new BaselineOverride();
    override.setName(null);
    assertTrue(override.hasName());
    override.clearName();
    assertFalse(override.hasName());
  }

  @Test
  void builderSetsFields() {
    BaselineOverride override =
        new BaselineOverride.Builder()
            .withName("snap")
            .withBrowser(Browser.FIREFOX)
            .withDevice("iPhone")
            .withOperatingSystem(OperatingSystem.IOS)
            .withBrowserVersion("119")
            .withOperatingSystemVersion("17")
            .withSuiteName("suite")
            .withTestName("test")
            .build();

    assertEquals("snap", override.getName());
    assertEquals(Browser.FIREFOX, override.getBrowser());
    assertEquals("iPhone", override.getDevice());
    assertEquals(OperatingSystem.IOS, override.getOperatingSystem());
    assertEquals("119", override.getBrowserVersion());
    assertEquals("17", override.getOperatingSystemVersion());
    assertEquals("suite", override.getSuiteName());
    assertEquals("test", override.getTestName());
  }

  @Test
  void builderWithNullSetsExplicitNull() {
    BaselineOverride override =
        new BaselineOverride.Builder().withName("snap").withName(null).build();
    assertNull(override.getName());
  }

  @Test
  void builderClearResetsToUnset() {
    BaselineOverride override = new BaselineOverride.Builder().withName("snap").clearName().build();
    assertNull(override.getName());
  }

  @Test
  void asGraphQLTypeCarriesSetValues() {
    BaselineOverride override =
        new BaselineOverride.Builder().withName("snap").withBrowser(Browser.CHROME).build();

    BaselineOverrideInput input = override.asGraphQLType();
    assertEquals("snap", input.getName());
    assertEquals(com.saucelabs.visual.graphql.type.Browser.CHROME, input.getBrowser());
  }

  @Test
  void asGraphQLTypeOmitsUnsetFields() {
    BaselineOverride override = new BaselineOverride.Builder().withName("snap").build();
    BaselineOverrideInput input = override.asGraphQLType();

    assertEquals("snap", input.getName());
    // Unset fields should remain null (not Optional.empty) on the input
    assertNull(input.browser());
    assertNull(input.device());
  }

  @Test
  void asGraphQLTypeCarriesExplicitNulls() {
    BaselineOverride override =
        new BaselineOverride.Builder().withName(null).withBrowser(null).build();
    BaselineOverrideInput input = override.asGraphQLType();

    // Explicitly null fields should be Optional.empty (not Java null)
    assertNotNull(input.name());
    assertFalse(input.name().isPresent());
    assertNotNull(input.browser());
    assertFalse(input.browser().isPresent());
  }
}
