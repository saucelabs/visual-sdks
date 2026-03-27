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

  public void setBrowser(Browser browser) {
    this.browser = Optional.ofNullable(browser);
  }

  public Optional<OperatingSystem> getOperatingSystem() {
    return operatingSystem;
  }

  public void setOperatingSystem(OperatingSystem operatingSystem) {
    this.operatingSystem = Optional.ofNullable(operatingSystem);
  }

  public Optional<String> getBrowserVersion() {
    return browserVersion;
  }

  public void setBrowserVersion(String browserVersion) {
    this.browserVersion = Optional.ofNullable(browserVersion);
  }

  public Optional<String> getDevice() {
    return device;
  }

  public void setDevice(String device) {
    this.device = Optional.ofNullable(device);
  }

  public Optional<String> getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Optional.ofNullable(name);
  }

  public Optional<String> getOperatingSystemVersion() {
    return operatingSystemVersion;
  }

  public void setOperatingSystemVersion(String operatingSystemVersion) {
    this.operatingSystemVersion = Optional.ofNullable(operatingSystemVersion);
  }

  public Optional<String> getSuiteName() {
    return suiteName;
  }

  public void setSuiteName(String suiteName) {
    this.suiteName = Optional.ofNullable(suiteName);
  }

  public Optional<String> getTestName() {
    return testName;
  }

  public void setTestName(String testName) {
    this.testName = Optional.ofNullable(testName);
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

    public Builder withBrowser(Browser browser) {
      this.browser = Optional.ofNullable(browser);
      return this;
    }

    public Builder withOperatingSystem(OperatingSystem operatingSystem) {
      this.operatingSystem = Optional.ofNullable(operatingSystem);
      return this;
    }

    public Builder withBrowserVersion(String browserVersion) {
      this.browserVersion = Optional.ofNullable(browserVersion);
      return this;
    }

    public Builder withDevice(String device) {
      this.device = Optional.ofNullable(device);
      return this;
    }

    public Builder withName(String name) {
      this.name = Optional.ofNullable(name);
      return this;
    }

    public Builder withOperatingSystemVersion(String operatingSystemVersion) {
      this.operatingSystemVersion = Optional.ofNullable(operatingSystemVersion);
      return this;
    }

    public Builder withSuiteName(String suiteName) {
      this.suiteName = Optional.ofNullable(suiteName);
      return this;
    }

    public Builder withTestName(String testName) {
      this.testName = Optional.ofNullable(testName);
      return this;
    }

    public BaselineOverride build() {
      BaselineOverride b = new BaselineOverride();
      b.setBrowser(this.browser != null ? this.browser.get() : null);
      b.setOperatingSystem(this.operatingSystem != null ? this.operatingSystem.get() : null);
      b.setBrowserVersion(this.browserVersion != null ? this.browserVersion.get() : null);
      b.setDevice(this.device != null ? this.device.get() : null);
      b.setName(this.name != null ? this.name.get() : null);
      b.setOperatingSystemVersion(this.operatingSystemVersion != null ? this.operatingSystemVersion.get() : null);
      b.setSuiteName(this.suiteName != null ? this.suiteName.get() : null);
      b.setTestName(this.testName != null ? this.testName.get() : null);
      return b;
    }
  }

  public BaselineOverrideInput asGraphQLType() {
    BaselineOverrideInput input = new BaselineOverrideInput();
    if (this.browser != null) {
      input.setBrowser(this.browser.map(Browser::asGraphQLType));
    }
    if (this.operatingSystem != null) {
      input.setOperatingSystem(this.operatingSystem.map(OperatingSystem::asGraphQLType));
    }
    if (this.browserVersion != null) {
      input.setBrowserVersion(this.browserVersion);
    }
    if (this.device != null) {
      input.setDevice(this.device);
    }
    if (this.name != null) {
      input.setName(this.name);
    }
    if (this.operatingSystemVersion != null) {
      input.setOperatingSystemVersion(this.operatingSystemVersion);
    }
    if (this.suiteName != null) {
      input.setSuiteName(this.suiteName);
    }
    if (this.testName != null) {
      input.setTestName(this.testName);
    }
    return input;
  }
}
