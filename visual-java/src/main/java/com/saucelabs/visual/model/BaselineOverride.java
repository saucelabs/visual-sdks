package com.saucelabs.visual.model;

import java.util.Optional;

public class BaselineOverride {
  private Optional<Browser> browser;
  private Optional<OperatingSystem> operatingSystem;
  private Optional<String> browserVersion;
  private Optional<String> device;
  private Optional<String> name;
  private Optional<String> operatingSystemVersion;
  private Optional<String> suiteName;
  private Optional<String> testName;

  public Optional<Browser> getBrowser() {
    return browser;
  }

  public void setBrowser(Optional<Browser> browser) {
    this.browser = browser;
  }

  public Optional<OperatingSystem> getOperatingSystem() {
    return operatingSystem;
  }

  public void setOperatingSystem(Optional<OperatingSystem> operatingSystem) {
    this.operatingSystem = operatingSystem;
  }

  public Optional<String> getBrowserVersion() {
    return browserVersion;
  }

  public void setBrowserVersion(Optional<String> browserVersion) {
    this.browserVersion = browserVersion;
  }

  public Optional<String> getDevice() {
    return device;
  }

  public void setDevice(Optional<String> device) {
    this.device = device;
  }

  public Optional<String> getName() {
    return name;
  }

  public void setName(Optional<String> name) {
    this.name = name;
  }

  public Optional<String> getOperatingSystemVersion() {
    return operatingSystemVersion;
  }

  public void setOperatingSystemVersion(Optional<String> operatingSystemVersion) {
    this.operatingSystemVersion = operatingSystemVersion;
  }

  public Optional<String> getSuiteName() {
    return suiteName;
  }

  public void setSuiteName(Optional<String> suiteName) {
    this.suiteName = suiteName;
  }

  public Optional<String> getTestName() {
    return testName;
  }

  public void setTestName(Optional<String> testName) {
    this.testName = testName;
  }


  public static class Builder {
    private Optional<Browser> browser;
    private Optional<OperatingSystem> operatingSystem;
    private Optional<String> browserVersion;
    private Optional<String> device;
    private Optional<String> name;
    private Optional<String> operatingSystemVersion;
    private Optional<String> suiteName;
    private Optional<String> testName;

    public Builder withBrowser(Optional<Browser> browser) {
      this.browser = browser;
      return this;
    }

    public Builder withOperatingSystem(Optional<OperatingSystem> operatingSystem) {
      this.operatingSystem = operatingSystem;
      return this;
    }

    public Builder withBrowserVersion(Optional<String> browserVersion) {
      this.browserVersion = browserVersion;
      return this;
    }

    public Builder withDevice(Optional<String> device) {
      this.device = device;
      return this;
    }

    public Builder withName(Optional<String> name) {
      this.name = name;
      return this;
    }

    public Builder withOperatingSystemVersion(Optional<String> operatingSystemVersion) {
      this.operatingSystemVersion = operatingSystemVersion;
      return this;
    }

    public Builder withSuiteName(Optional<String> suiteName) {
      this.suiteName = suiteName;
      return this;
    }

    public Builder withTestName(Optional<String> testName) {
      this.testName = testName;
      return this;
    }

    public BaselineOverride build() {
      BaselineOverride b = new BaselineOverride();
      b.setBrowser(this.browser);
      b.setOperatingSystem(this.operatingSystem);
      b.setBrowserVersion(this.browserVersion);
      b.setDevice(this.device);
      b.setName(this.name);
      b.setOperatingSystemVersion(this.operatingSystemVersion);
      b.setSuiteName(this.suiteName);
      b.setTestName(this.testName);
      return b;
    }
  }

  public BaselineOverrideInput asGraphQLType() {
    BaselineOverrideInput input = new BaselineOverrideInput();
    input.setBrowser(this.browser != null ? this.browser.map(Browser::asGraphQLType).orElse(null) : null);
    input.setOperatingSystem(this.operatingSystem != null ? this.operatingSystem.map(OperatingSystem::asGraphQLType).orElse(null) : null);
    input.setBrowserVersion(this.browserVersion != null ? this.browserVersion.orElse(null): null);
    input.setDevice(this.device != null ? this.device.orElse(null): null);
    input.setName(this.name != null ? this.name.orElse(null): null);
    input.setOperatingSystemVersion(this.operatingSystemVersion != null ? this.operatingSystemVersion.orElse(null): null);
    input.setSuiteName(this.suiteName != null ? this.suiteName.orElse(null): null);
    input.setTestName(this.testName != null ? this.testName.orElse(null): null);
    return input;
  }
}
