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

  public JSOptional<Browser> getBrowser() {
    return browser;
  }

  public void setBrowser(Browser browser) {
    this.browser = JSOptional.ofNullable(browser);
  }

  public JSOptional<OperatingSystem> getOperatingSystem() {
    return operatingSystem;
  }

  public void setOperatingSystem(OperatingSystem os) {
    this.operatingSystem = JSOptional.ofNullable(os);
  }

  public JSOptional<String> getBrowserVersion() {
    return browserVersion;
  }

  public void setBrowserVersion(String v) {
    this.browserVersion = JSOptional.ofNullable(v);
  }

  public JSOptional<String> getDevice() {
    return device;
  }

  public void setDevice(String device) {
    this.device = JSOptional.ofNullable(device);
  }

  public JSOptional<String> getName() {
    return name;
  }

  public void setName(String name) {
    this.name = JSOptional.ofNullable(name);
  }

  public JSOptional<String> getOperatingSystemVersion() {
    return operatingSystemVersion;
  }

  public void setOperatingSystemVersion(String v) {
    this.operatingSystemVersion = JSOptional.ofNullable(v);
  }

  public JSOptional<String> getSuiteName() {
    return suiteName;
  }

  public void setSuiteName(String suiteName) {
    this.suiteName = JSOptional.ofNullable(suiteName);
  }

  public JSOptional<String> getTestName() {
    return testName;
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
