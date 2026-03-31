package com.saucelabs.visual.graphql;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.saucelabs.visual.graphql.type.Browser;
import com.saucelabs.visual.graphql.type.OperatingSystem;
import com.saucelabs.visual.model.BaselineOverrideInput;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BaselineOverrideInputTest {

  private ObjectMapper mapper;

  @BeforeEach
  void setUp() {
    mapper = new ObjectMapper();
    mapper.registerModule(new Jdk8Module());
  }

  @Test
  void allFieldsOmittedWhenUnset() throws Exception {
    BaselineOverrideInput input = new BaselineOverrideInput();
    String json = mapper.writeValueAsString(input);
    assertEquals("{}", json);
  }

  @Test
  void setStringFieldsViaDirectSetter() throws Exception {
    BaselineOverrideInput input = new BaselineOverrideInput();
    input.setName("snapshot-1");
    input.setDevice("iPhone 15");
    input.setBrowserVersion("120.0");
    input.setOperatingSystemVersion("17.0");
    input.setSuiteName("my-suite");
    input.setTestName("my-test");

    assertEquals("snapshot-1", input.getName());
    assertEquals("iPhone 15", input.getDevice());
    assertEquals("120.0", input.getBrowserVersion());
    assertEquals("17.0", input.getOperatingSystemVersion());
    assertEquals("my-suite", input.getSuiteName());
    assertEquals("my-test", input.getTestName());
  }

  @Test
  void setEnumFieldsViaDirectSetter() {
    BaselineOverrideInput input = new BaselineOverrideInput();
    input.setBrowser(Browser.CHROME);
    input.setOperatingSystem(OperatingSystem.WINDOWS);

    assertEquals(Browser.CHROME, input.getBrowser());
    assertEquals(OperatingSystem.WINDOWS, input.getOperatingSystem());
  }

  @Test
  void setFieldsViaOptionalSetter() {
    BaselineOverrideInput input = new BaselineOverrideInput();
    input.setName(Optional.of("snapshot-1"));
    input.setBrowser(Optional.of(Browser.FIREFOX));

    assertEquals("snapshot-1", input.getName());
    assertEquals(Browser.FIREFOX, input.getBrowser());
    assertEquals(Optional.of("snapshot-1"), input.name());
    assertEquals(Optional.of(Browser.FIREFOX), input.browser());
  }

  @Test
  void explicitNullSerializedAsNull() throws Exception {
    BaselineOverrideInput input = new BaselineOverrideInput();
    input.setName(Optional.empty());

    String json = mapper.writeValueAsString(input);
    assertTrue(json.contains("\"name\":null"), "Expected explicit null for name, got: " + json);
  }

  @Test
  void unsetFieldsOmittedFromJson() throws Exception {
    BaselineOverrideInput input = new BaselineOverrideInput();

    String json = mapper.writeValueAsString(input);
    assertFalse(json.contains("name"), "Unset name should be omitted");
    assertFalse(json.contains("browser"), "Unset browser should be omitted");
    assertFalse(json.contains("device"), "Unset device should be omitted");
    assertFalse(json.contains("suiteName"), "Unset suiteName should be omitted");
    assertFalse(json.contains("testName"), "Unset testName should be omitted");
    assertFalse(json.contains("operatingSystem"), "Unset operatingSystem should be omitted");
    assertFalse(json.contains("browserVersion"), "Unset browserVersion should be omitted");
    assertFalse(
        json.contains("operatingSystemVersion"), "Unset operatingSystemVersion should be omitted");
  }

  @Test
  void allFieldsSerializedWhenSet() throws Exception {
    BaselineOverrideInput input = new BaselineOverrideInput();
    input.setBrowser(Browser.CHROME);
    input.setOperatingSystem(OperatingSystem.LINUX);
    input.setBrowserVersion("120.0");
    input.setDevice("Pixel 8");
    input.setName("my-snapshot");
    input.setOperatingSystemVersion("14");
    input.setSuiteName("suite-a");
    input.setTestName("test-1");

    String json = mapper.writeValueAsString(input);
    assertTrue(json.contains("\"browser\":\"CHROME\""));
    assertTrue(json.contains("\"operatingSystem\":\"LINUX\""));
    assertTrue(json.contains("\"browserVersion\":\"120.0\""));
    assertTrue(json.contains("\"device\":\"Pixel 8\""));
    assertTrue(json.contains("\"name\":\"my-snapshot\""));
    assertTrue(json.contains("\"operatingSystemVersion\":\"14\""));
    assertTrue(json.contains("\"suiteName\":\"suite-a\""));
    assertTrue(json.contains("\"testName\":\"test-1\""));
  }

  @Test
  void nullPassedToDirectSetterSerializesAsExplicitNull() throws Exception {
    BaselineOverrideInput input = new BaselineOverrideInput();
    input.setName(Optional.ofNullable(null));

    String json = mapper.writeValueAsString(input);
    assertTrue(json.contains("\"name\":null"), "null via setter should serialize as null: " + json);
  }

  @Test
  void mixOfSetNullAndUnsetFields() throws Exception {
    BaselineOverrideInput input = new BaselineOverrideInput();
    input.setName("snapshot-1");
    input.setBrowser(Optional.empty());
    // leave the rest unset

    String json = mapper.writeValueAsString(input);
    assertTrue(json.contains("\"name\":\"snapshot-1\""));
    assertTrue(json.contains("\"browser\":null"));
    assertFalse(json.contains("device"));
    assertFalse(json.contains("testName"));
  }
}
