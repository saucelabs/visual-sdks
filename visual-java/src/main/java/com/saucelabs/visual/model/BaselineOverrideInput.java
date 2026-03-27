package com.saucelabs.visual.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.graphql_java_generator.annotation.GraphQLScalar;
import com.saucelabs.visual.graphql.type.BaselineOverrideIn;
import com.saucelabs.visual.graphql.type.Browser;
import com.saucelabs.visual.graphql.type.OperatingSystem;

import java.util.Optional;

/**
 * Helper class for serializing optional values (undefined (omitted), null, and Value) into
 * GraphQL schema. Internal use only. Extends the default BaselineOverrideIn so we can use it in
 * standard graphql requests / inputs as a subclass while handling serialization differently.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaselineOverrideInput extends BaselineOverrideIn {

  @JsonProperty("browser")
  @GraphQLScalar( fieldName = "browser", graphQLTypeSimpleName = "Browser", javaClass = com.saucelabs.visual.graphql.type.Browser.class, listDepth = 0)
  private Optional<Browser> browser;

  @Override
  public void setBrowser(Browser browser) {
    this.browser = Optional.ofNullable(browser);
  }

  @Override
  @JsonIgnore
  public Browser getBrowser() {
    return this.browser.orElse(null);
  }

  public void setBrowser(Optional<Browser> browser){
    this.browser = browser;
  }

  @JsonProperty("browser")
  public Optional<Browser> browser(){
    return this.browser;
  }

  @JsonProperty("operatingSystem")
  @GraphQLScalar( fieldName = "operatingSystem", graphQLTypeSimpleName = "OperatingSystem", javaClass = com.saucelabs.visual.graphql.type.OperatingSystem.class, listDepth = 0)
  private Optional<OperatingSystem> operatingSystem;

  @Override
  public void setOperatingSystem(OperatingSystem operatingSystem) {
    this.operatingSystem = Optional.ofNullable(operatingSystem);
  }

  @Override
  @JsonIgnore
  public OperatingSystem getOperatingSystem() {
    return this.operatingSystem.orElse(null);
  }

  public void setOperatingSystem(Optional<OperatingSystem> operatingSystem){
    this.operatingSystem = operatingSystem;
  }

  @JsonProperty("operatingSystem")
  public Optional<OperatingSystem> operatingSystem(){
    return this.operatingSystem;
  }

  @JsonProperty("browserVersion")
  @GraphQLScalar( fieldName = "browserVersion", graphQLTypeSimpleName = "String", javaClass = java.lang.String.class, listDepth = 0)
  private Optional<String> browserVersion;

  @Override
  public void setBrowserVersion(String browserVersion) {
    this.browserVersion = Optional.ofNullable(browserVersion);
  }

  @Override
  @JsonIgnore
  public String getBrowserVersion() {
    return this.browserVersion.orElse(null);
  }

  public void setBrowserVersion(Optional<String> browserVersion){
    this.browserVersion = browserVersion;
  }

  @JsonProperty("browserVersion")
  public Optional<String> browserVersion(){
    return this.browserVersion;
  }

  @JsonProperty("device")
  @GraphQLScalar( fieldName = "device", graphQLTypeSimpleName = "String", javaClass = java.lang.String.class, listDepth = 0)
  private Optional<String> device;

  @Override
  public void setDevice(String device) {
    this.device = Optional.ofNullable(device);
  }

  @Override
  @JsonIgnore
  public String getDevice() {
    return this.device.orElse(null);
  }

  public void setDevice(Optional<String> device){
    this.device = device;
  }

  @JsonProperty("device")
  public Optional<String> device(){
    return this.device;
  }

  @JsonProperty("name")
  @GraphQLScalar( fieldName = "name", graphQLTypeSimpleName = "String", javaClass = java.lang.String.class, listDepth = 0)
  private Optional<String> name;

  @Override
  public void setName(String name) {
    this.name = Optional.ofNullable(name);
  }

  @Override
  @JsonIgnore
  public String getName() {
    return this.name.orElse(null);
  }

  public void setName(Optional<String> name){
    this.name = name;
  }

  @JsonProperty("name")
  public Optional<String> name(){
    return this.name;
  }

  @JsonProperty("operatingSystemVersion")
  @GraphQLScalar( fieldName = "operatingSystemVersion", graphQLTypeSimpleName = "String", javaClass = java.lang.String.class, listDepth = 0)
  private Optional<String> operatingSystemVersion;

  @Override
  public void setOperatingSystemVersion(String operatingSystemVersion) {
    this.operatingSystemVersion = Optional.ofNullable(operatingSystemVersion);
  }

  @Override
  @JsonIgnore
  public String getOperatingSystemVersion() {
    return this.operatingSystemVersion.orElse(null);
  }

  public void setOperatingSystemVersion(Optional<String> operatingSystemVersion){
    this.operatingSystemVersion = operatingSystemVersion;
  }

  @JsonProperty("operatingSystemVersion")
  public Optional<String> operatingSystemVersion(){
    return this.operatingSystemVersion;
  }

  @JsonProperty("suiteName")
  @GraphQLScalar( fieldName = "suiteName", graphQLTypeSimpleName = "String", javaClass = java.lang.String.class, listDepth = 0)
  private Optional<String> suiteName;

  @Override
  public void setSuiteName(String suiteName) {
    this.suiteName = Optional.ofNullable(suiteName);
  }

  @Override
  @JsonIgnore
  public String getSuiteName() {
    return this.suiteName.orElse(null);
  }

  public void setSuiteName(Optional<String> suiteName){
    this.suiteName = suiteName;
  }

  @JsonProperty("suiteName")
  public Optional<String> suiteName(){
    return this.suiteName;
  }

  @JsonProperty("testName")
  @GraphQLScalar( fieldName = "testName", graphQLTypeSimpleName = "String", javaClass = java.lang.String.class, listDepth = 0)
  private Optional<String> testName;

  @Override
  public void setTestName(String testName) {
    this.testName = Optional.ofNullable(testName);
  }

  @Override
  @JsonIgnore
  public String getTestName() {
    return this.testName.orElse(null);
  }

  public void setTestName(Optional<String> testName){
    this.testName = testName;
  }

  @JsonProperty("testName")
  public Optional<String> testName(){
    return this.testName;
  }
}
