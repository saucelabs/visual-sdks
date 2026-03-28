package com.saucelabs.visual.model;

public class BaselineOverride {
  private JSOptional<Browser> browser = JSOptional.unset();
  private JSOptional<OperatingSystem> operatingSystem = JSOptional.unset();
  private JSOptional<String> browserVersion = JSOptional.unset();
  private JSOptional<String> device = JSOptional.unset();
  private JSOptional<String> name = JSOptional.unset();
  private JSOptional<String> operatingSystemVersion = JSOptional.unset();
  private JSOptional<String> suiteName = JSOptional.unset();
  private JSOptional<String> testName = JSOptional.unset();

  public Browser getBrowser() {
    return browser.orElse(null);
  }

  public void setBrowser(Browser browser) {
    this.browser = JSOptional.ofNullable(browser);
  }

  public OperatingSystem getOperatingSystem() {
    return operatingSystem.orElse(null);
  }

  public void setOperatingSystem(OperatingSystem os) {
    this.operatingSystem = JSOptional.ofNullable(os);
  }

  public String getBrowserVersion() {
    return browserVersion.orElse(null);
  }

  public void setBrowserVersion(String v) {
    this.browserVersion = JSOptional.ofNullable(v);
  }

  public String getDevice() {
    return device.orElse(null);
  }

  public void setDevice(String device) {
    this.device = JSOptional.ofNullable(device);
  }

  public String getName() {
    return name.orElse(null);
  }

  public void setName(String name) {
    this.name = JSOptional.ofNullable(name);
  }

  public String getOperatingSystemVersion() {
    return operatingSystemVersion.orElse(null);
  }

  public void setOperatingSystemVersion(String v) {
    this.operatingSystemVersion = JSOptional.ofNullable(v);
  }

  public String getSuiteName() {
    return suiteName.orElse(null);
  }

  public void setSuiteName(String suiteName) {
    this.suiteName = JSOptional.ofNullable(suiteName);
  }

  public String getTestName() {
    return testName.orElse(null);
  }

  public void setTestName(String testName) {
    this.testName = JSOptional.ofNullable(testName);
  }

  public static class Builder {
    private JSOptional<Browser> browser = JSOptional.unset();
    private JSOptional<OperatingSystem> operatingSystem = JSOptional.unset();
    private JSOptional<String> browserVersion = JSOptional.unset();
    private JSOptional<String> device = JSOptional.unset();
    private JSOptional<String> name = JSOptional.unset();
    private JSOptional<String> operatingSystemVersion = JSOptional.unset();
    private JSOptional<String> suiteName = JSOptional.unset();
    private JSOptional<String> testName = JSOptional.unset();

    public Builder withBrowser(Browser b) {
      this.browser = JSOptional.ofNullable(b);
      return this;
    }

    public Builder withOperatingSystem(OperatingSystem os) {
      this.operatingSystem = JSOptional.ofNullable(os);
      return this;
    }

    public Builder withBrowserVersion(String v) {
      this.browserVersion = JSOptional.ofNullable(v);
      return this;
    }

    public Builder withDevice(String v) {
      this.device = JSOptional.ofNullable(v);
      return this;
    }

    public Builder withName(String v) {
      this.name = JSOptional.ofNullable(v);
      return this;
    }

    public Builder withOperatingSystemVersion(String v) {
      this.operatingSystemVersion = JSOptional.ofNullable(v);
      return this;
    }

    public Builder withSuiteName(String v) {
      this.suiteName = JSOptional.ofNullable(v);
      return this;
    }

    public Builder withTestName(String v) {
      this.testName = JSOptional.ofNullable(v);
      return this;
    }

    public BaselineOverride build() {
      BaselineOverride b = new BaselineOverride();
      b.browser = this.browser;
      b.operatingSystem = this.operatingSystem;
      b.browserVersion = this.browserVersion;
      b.device = this.device;
      b.name = this.name;
      b.operatingSystemVersion = this.operatingSystemVersion;
      b.suiteName = this.suiteName;
      b.testName = this.testName;
      return b;
    }
  }

  public BaselineOverrideInput asGraphQLType() {
    BaselineOverrideInput input = new BaselineOverrideInput();
    this.browser.ifSet(b -> input.setBrowser(b.map(Browser::asGraphQLType)));
    this.operatingSystem.ifSet(
        os -> input.setOperatingSystem(os.map(OperatingSystem::asGraphQLType)));
    this.browserVersion.ifSet(input::setBrowserVersion);
    this.device.ifSet(input::setDevice);
    this.name.ifSet(input::setName);
    this.operatingSystemVersion.ifSet(input::setOperatingSystemVersion);
    this.suiteName.ifSet(input::setSuiteName);
    this.testName.ifSet(input::setTestName);
    return input;
  }
}
