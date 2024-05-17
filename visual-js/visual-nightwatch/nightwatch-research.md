# Nightwatch Research

## Page Objects

Creating and using page objects with Nightwatch is "different" in comparison to other JS/TS frameworks. More information can be found [here](https://nightwatchjs.org/guide/using-page-objects/getting-started.html).

Here are some main learnings:

- Page Object files need to be loaded through the configuration file
- Then in the test file you can use the page object by calling `const pageObjectName = browser.page.<pageObjectName>()`
- Referring to elements in the page object can be done by using the `@` symbol, like `browser.waitForElementVisible('@username')`
- Page Object elements can be passed to custom commands as a single argument, like `browser.customCommand('@username')` and then be accessed in the custom command by using `arg.__selector`
- Page Object element can not be passed to custom commands as an array or an object with multiple elements, like `browser.customCommand(['@username', '@password'])` or `browser.customCommand({ username: '@username', password: '@password' })`.

ATM I have not found a way to pass (multiple) page object elements to a custom command in a way that would be compliant to how page objects are referred to (with the `@element` annotation). This is a "problem" when you want to use the [ignore regions](#ignored-regions) feature with page objects. There is an alternative way to do this, but it is not as clean as the other options. This would look like this:

```ts
var pageObjectName = browser.page.pageObjectName();

browser.sauceVisualCheck('Home Page', {
  ignore: [pageObjectName.elements.username.selector],
});
```

## Ignore Regions

Ignore regions can be done in 3 ways:

- by providing an object with `x`, `y`, `width`, `height` properties => supported
- by providing an array of selectors => supported
- by providing an array of page objects references => supported

### Object with `x`, `y`, `width`, `height` properties

```ts
  'Check Home Page with ignore region coordinates': () => {
    browser
      .url('https://saucedemo.com')
      .waitForElementVisible('input[data-test="username"]')
      .sauceVisualCheck('Home Page', {
        ignore: [
          {
            x: 100,
            y: 100,
            width: 200,
            height: 200,
          },
        ],
      })
      .end();
  },
```

### Array of selectors

```ts
  'Check Home Page with ignore region string selector': () => {
    browser
      .url('https://saucedemo.com')
      .waitForElementVisible('input[data-test="username"]')
      .sauceVisualCheck('Home Page', {
        ignore: [
          // This works
          'input[data-test="password"]',
          // This also works
          ['input[data-test="password"]'],
          // This does not work consistently
          ['input[data-test="password"]', 'input[data-test="username"]'],
          ],
      })
      .end();
  },
```

### Array of page objects references

The default way of using page objects is by using the `@` symbol, like `browser.waitForElementVisible('@username')`. This is not supported when using the ignore regions feature due to the lack of page object inheritance in the custom command. Instead you need to use the `pageObjectName.elements.username.selector` syntax. This is not very clean, but it works.

**NOTE**: If the normal syntax is used, then the service will filter out the property, not use it and log a warning like

```sh
Ignoring page object reference: '@username'. Please use the 'pageObjectName.elements.username.selector' annotation.
```

```ts
  'Check Home Page with ignore region pageobject': () => {
    var login = browser.page.login();
    login
      .navigate()
      .waitForElementVisible('@username')
      .sauceVisualCheck('Home Page', {
        ignore: [
          // This works
          login.elements.username.selector,
          // This works
          [login.elements.username.selector, login.elements.password.selector],
        ],
      })
      .end();
  },
```

## Test Case names

**NOTE:** This has been solved now, but I will leave this here for reference

There are multiple ways to write a test with Nightwatch. When you set Nightwatch up with the `npm init nightwatch` command you can select from a few options:

- JavaScript / default
- TypeScript / default
- JavaScript / Mocha
- JavaScript / CucumberJS

### JavaScript / default | TypeScript / default

With JS/TS default way can be written in two ways:

```ts
// File: tests/saucedemo.describe.ts
// ...
describe('Sauce Demo', function (this: ExtendDescribeThis<CustomThis>) {
  it('Check Home Page', (browser) => {
    browser.url('https://saucedemo.com').customCommand('Home Page');
  });

  it('Check Inventory Page', (browser) => {
    browser.url('https://saucedemo.com').customCommand('Inventory Page');
    //....
  });
});
```

or

```ts
// File: tests/saudedemo.ts
// ...
const home = {
  'Check Home Page': () => {
    browser.url('https://saucedemo.com').customCommand('Home Page').end();
  },

  'Check Inventory Page': () => {
    browser.url('https://saucedemo.com').customCommand('Inventory Page').end();
  },
};

export default home;
```

Output is the same for both options:

```ts
// File customCommand.ts
const EventEmitter = require('events').EventEmitter;

module.exports = class CustomCommand extends EventEmitter {
  async command(name) {
    const nightwatchBrowserObject = this.api;
    console.log(
      'nightwatchBrowserObject.currentTest',
      nightwatchBrowserObject.currentTest,
    );
    // ...
  }
```

```sh
  Running Check Home Page:
───────────────────────────────────────────────────────────────────────────────────────────────────
  ℹ Loaded url https://saucedemo.com in 661ms
nightwatchBrowserObject.currentTest {
  name: 'Check Home Page',
  module: 'duckDuckGo.describe',
  group: '',
  results: {
    time: 0,
    assertions: [],
    commands: [],
    passed: 0,
    errors: 0,
    failed: 0,
    retries: undefined,
    skipped: 0,
    tests: 0,
    status: 'pass',
    startTimestamp: 1701502797843,
    httpOutput: [],
    steps: [ 'Check Inventory Page' ],
    stackTrace: '',
    testcases: { 'Check Home Page': [Object] }
  },
  timestamp: 'Sat, 02 Dec 2023 07:39:54 GMT'
}
No assertions ran.


  Running Check Inventory Page:
───────────────────────────────────────────────────────────────────────────────────────────────────
  ℹ Loaded url https://saucedemo.com in 172ms
nightwatchBrowserObject.currentTest {
  name: 'Check Inventory Page',
  module: 'duckDuckGo.describe',
  group: '',
  results: {
    time: 0,
    assertions: [],
    commands: [],
    passed: 0,
    errors: 0,
    failed: 0,
    retries: undefined,
    skipped: 0,
    tests: 0,
    status: 'pass',
    startTimestamp: 1701502798538,
    httpOutput: [],
    steps: [],
    stackTrace: '',
    testcases: { 'Check Home Page': [Object], 'Check Inventory Page': [Object] }
  },
  timestamp: 'Sat, 02 Dec 2023 07:39:54 GMT'
}
No assertions ran.


  ✨ PASSED. 2 tests (12.19s)
```

Running this with the event listener in the globals we get this

```js
  registerEventHandlers(eventBroadcaster) {
    eventBroadcaster.on('TestSuiteStarted', (args) =>{
        console.log('TestSuiteStarted', args)
    });

    eventBroadcaster.on('TestRunStarted', (args) => {
      console.log('TestRunStarted', args);
    });
  },

```

```sh
TestSuiteStarted {
  envelope: {},
  metadata: {
    testEnv: 'sauceChrome',
    sessionCapabilities: {},
    sessionId: '',
    tags: [],
    modulePath: '/Users/wimselles/Sauce/Git/hackathon/nightwatch/ts-default/test/saucedemo.ts',
    name: 'Saucedemo',
    host: 'ondemand.eu-central-1.saucelabs.com'
  }
}
TestRunStarted {
  envelope: {
    __global_beforeEach_hook: {
      time: '0.001000',
      assertions: [],
      commands: [],
      passed: 0,
      errors: 0,
      failed: 0,
      retries: undefined,
      skipped: 0,
      tests: 0,
      status: 'pass',
      startTimestamp: 1701780053194,
      httpOutput: [Array],
      timeMs: 1,
      endTimestamp: 1701780053195
    },
    __before_hook: {
      time: '0.000',
      assertions: [],
      commands: [],
      passed: 0,
      errors: 0,
      failed: 0,
      retries: undefined,
      skipped: 0,
      tests: 0,
      status: 'pass',
      startTimestamp: 1701780053195,
      httpOutput: [],
      timeMs: 0,
      endTimestamp: 1701780053195
    },
    'Check Home Page': {
      time: 0,
      assertions: [],
      commands: [],
      passed: 0,
      errors: 0,
      failed: 0,
      retries: undefined,
      skipped: 0,
      tests: 0,
      status: 'pass',
      startTimestamp: 1701780053195,
      httpOutput: [],
      beforeEach: [Object]
    }
  },
  metadata: {
    testEnv: 'sauceChrome',
    sessionCapabilities: {
      'goog:chromeOptions': [Object],
      browserVersion: '119.0.6045.106',
      'webauthn:extension:minPinLength': true,
      timeouts: [Object],
      strictFileInteractability: false,
      acceptInsecureCerts: false,
      'webauthn:extension:prf': true,
      networkConnectionEnabled: false,
      'fedcm:accounts': true,
      chrome: [Object],
      browserName: 'chrome',
      setWindowRect: true,
      proxy: {},
      'webauthn:virtualAuthenticators': true,
      pageLoadStrategy: 'normal',
      'webauthn:extension:largeBlob': true,
      platformName: 'windows',
      unhandledPromptBehavior: 'dismiss and notify',
      'webauthn:extension:credBlob': true
    },
    sessionId: '359b8e25853743d88afad14de3ec6e09',
    tags: [],
    modulePath: '/Users/wimselles/Sauce/Git/hackathon/nightwatch/ts-default/test/saucedemo.ts',
    name: 'Saucedemo',
    host: 'ondemand.eu-central-1.saucelabs.com'
  },
  testcase: 'Check Home Page'
}
```

### JavaScript / Mocha

Writing a test like this

```js
// File: nightwatch/examples/basic/saucedemo.js
describe('Saucedemo example', function () {
  it('Check Home Page', (browser) => {
    browser.url('https://saucedemo.com').customCommand('Home Page');
  });

  it('Check Inventory Page', (browser) => {
    browser.url('https://saucedemo.com').customCommand('Inventory Page');
    //....
  });
});
```

will create this output is

```ts
// File customCommand.ts
const EventEmitter = require('events').EventEmitter;

module.exports = class CustomCommand extends EventEmitter {
  async command(name) {
    const nightwatchBrowserObject = this.api;
    console.log(
      'nightwatchBrowserObject.currentTest',
      nightwatchBrowserObject.currentTest,
    );
    // ...
  }
```

```sh
  Running Check Home Page...
  ℹ Loaded url https://saucedemo.com in 2830ms
nightwatchBrowserObject.currentTest {
  name: '',
  module: 'basic/saucedemo',
  group: 'basic',
  results: {
    errors: 0,
    failed: 0,
    passed: 0,
    assertions: [],
    commands: [],
    tests: 0,
    status: 'pass'
  },
  timestamp: 'Sat, 02 Dec 2023 08:53:57 GMT'
}
  ✔ Saucedemo example Check Home Page: 2836ms
    Saucedemo example Check Inventory Page:
  Running Check Inventory Page...
  ℹ Loaded url https://saucedemo.com in 820ms
nightwatchBrowserObject.currentTest {
  name: '',
  module: 'basic/saucedemo',
  group: 'basic',
  results: {
    errors: 0,
    failed: 0,
    passed: 0,
    assertions: [],
    commands: [],
    tests: 0,
    status: 'pass'
  },
  timestamp: 'Sat, 02 Dec 2023 08:53:57 GMT'
}
  ✔ Saucedemo example Check Inventory Page: 823ms

  2 passing (18s)

✨  Done in 20.91s.
```

This means there is no way to get the test case name based on current logic

When the `this`, not the `browser`, is passed from the test to the custom command we can get this data in the custom command

```sh
<ref *1> Suite {
  title: 'Saucedemo example',
  ctx: <ref *2> Context {
    _runnable: Test {
      type: 'test',
      title: 'Check Home Page',
      fn: [Function (anonymous)],
      body: '(browser) => {\n' +
        "    console.log('browser = ', browser);\n" +
        "    // console.log('test => this.title = ', this.title);\n" +
        "    // console.log('test => this.ctx = ', this.ctx);\n" +
        "    browser.url('https://saucedemo.com').sauceVisualCheck('Home Page', this);\n" +
        '  }',
      async: 1,
      sync: false,
      _timeout: 20000,
      _slow: 75,
      _retries: -1,
      timedOut: false,
      _currentRetry: 0,
      pending: false,
      file: '/Users/wimselles/Sauce/Git/hackathon/nightwatch/js-mocha/nightwatch/examples/basic/saucedemo.js',
      parent: [Circular *1],
      ctx: [Circular *2],
      run: [Function: bound ],
      _events: [Object: null prototype],
      _eventsCount: 1,
      _enableTimeouts: false,
      callback: [Function: done],
      timer: Timeout {
        _idleTimeout: 20000,
        _idlePrev: [TimersList],
        _idleNext: [TimersList],
        _idleStart: 7083,
        _onTimeout: [Function (anonymous)],
        _timerArgs: undefined,
        _repeat: null,
        _destroyed: false,
        [Symbol(refed)]: true,
        [Symbol(kHasPrimitive)]: false,
        [Symbol(asyncId)]: 187,
        [Symbol(triggerId)]: 185
      }
    },
    test: Test {
      type: 'test',
      title: 'Check Home Page',
      fn: [Function (anonymous)],
      body: '(browser) => {\n' +
        "    console.log('browser = ', browser);\n" +
        "    // console.log('test => this.title = ', this.title);\n" +
        "    // console.log('test => this.ctx = ', this.ctx);\n" +
        "    browser.url('https://saucedemo.com').sauceVisualCheck('Home Page', this);\n" +
        '  }',
      async: 1,
      sync: false,
      _timeout: 20000,
      _slow: 75,
      _retries: -1,
      timedOut: false,
      _currentRetry: 0,
      pending: false,
      file: '/Users/wimselles/Sauce/Git/hackathon/nightwatch/js-mocha/nightwatch/examples/basic/saucedemo.js',
      parent: [Circular *1],
      ctx: [Circular *2],
      run: [Function: bound ],
      _events: [Object: null prototype],
      _eventsCount: 1,
      _enableTimeouts: false,
      callback: [Function: done],
      timer: Timeout {
        _idleTimeout: 20000,
        _idlePrev: [TimersList],
        _idleNext: [TimersList],
        _idleStart: 7083,
        _onTimeout: [Function (anonymous)],
        _timerArgs: undefined,
        _repeat: null,
        _destroyed: false,
        [Symbol(refed)]: true,
        [Symbol(kHasPrimitive)]: false,
        [Symbol(asyncId)]: 187,
        [Symbol(triggerId)]: 185
      }
    }
  },
  suites: [],
  tests: [
    Test {
      type: 'test',
      title: 'Check Home Page',
      fn: [Function (anonymous)],
      body: '(browser) => {\n' +
        "    console.log('browser = ', browser);\n" +
        "    // console.log('test => this.title = ', this.title);\n" +
        "    // console.log('test => this.ctx = ', this.ctx);\n" +
        "    browser.url('https://saucedemo.com').sauceVisualCheck('Home Page', this);\n" +
        '  }',
      async: 1,
      sync: false,
      _timeout: 20000,
      _slow: 75,
      _retries: -1,
      timedOut: false,
      _currentRetry: 0,
      pending: false,
      file: '/Users/wimselles/Sauce/Git/hackathon/nightwatch/js-mocha/nightwatch/examples/basic/saucedemo.js',
      parent: [Circular *1],
      ctx: [Context],
      run: [Function: bound ],
      _events: [Object: null prototype],
      _eventsCount: 1,
      _enableTimeouts: false,
      callback: [Function: done],
      timer: Timeout {
        _idleTimeout: 20000,
        _idlePrev: [TimersList],
        _idleNext: [TimersList],
        _idleStart: 7083,
        _onTimeout: [Function (anonymous)],
        _timerArgs: undefined,
        _repeat: null,
        _destroyed: false,
        [Symbol(refed)]: true,
        [Symbol(kHasPrimitive)]: false,
        [Symbol(asyncId)]: 187,
        [Symbol(triggerId)]: 185
      }
    }
  ],
  root: false,
  pending: false,
  _retries: -1,
  _beforeEach: [],
  _beforeAll: [],
  _afterEach: [],
  _afterAll: [],
  _timeout: 20000,
  _slow: 75,
  _bail: false,
  _onlyTests: [],
  _onlySuites: [],
  delayed: false,
  parent: Suite {
    title: '',
    ctx: Context {},
    suites: [ [Circular *1] ],
    tests: [],
    root: true,
    pending: false,
    _retries: -1,
    _beforeEach: [],
    _beforeAll: [],
    _afterEach: [],
    _afterAll: [],
    _timeout: 20000,
    _slow: 75,
    _bail: false,
    _onlyTests: [],
    _onlySuites: [],
    delayed: false,
    _events: [Object: null prototype] {
      'pre-require': [Array],
      suite: [Function (anonymous)]
    },
    _eventsCount: 2
  },
  _events: [Object: null prototype] { suite: [Function (anonymous)] },
  _eventsCount: 1,
  '@nightwatch_promise': [Function (anonymous)],
  file: '/Users/wimselles/Sauce/Git/hackathon/nightwatch/js-mocha/nightwatch/examples/basic/saucedemo.js'
}
```

Running this with the event listener in the globals we get this

```js
  registerEventHandlers(eventBroadcaster) {
    eventBroadcaster.on('TestSuiteStarted', (args) =>{
        console.log('TestSuiteStarted', args)
    });

    eventBroadcaster.on('TestRunStarted', (args) => {
      console.log('TestRunStarted', args);
    });
  },

```

```sh
TestSuiteStarted {
  envelope: {},
  metadata: {
    testEnv: 'sauceChrome',
    sessionCapabilities: {},
    sessionId: '',
    tags: [],
    modulePath: '/Users/wimselles/Sauce/Git/hackathon/nightwatch/js-mocha/nightwatch/examples/basic/saucedemo.js',
    name: 'Basic/Saucedemo',
    host: 'ondemand.eu-central-1.saucelabs.com'
  }
}
```

Checked all the other events, but none of them contain the test case names

```js
// For Mocha (?)
// These events are not triggered in Mocha
eventBroadcaster.on('GlobalBeforeStarted', (args) => {
  console.log('GlobalBeforeStarted', args);
});
eventBroadcaster.on('GlobalBeforeChildProcessStarted', (args) => {
  console.log('GlobalBeforeChildProcessStarted', args);
});
eventBroadcaster.on('GlobalBeforeEachStarted', (args) => {
  console.log('GlobalBeforeEachStarted', args);
});
eventBroadcaster.on('BeforeStarted', (args) => {
  console.log('BeforeStarted', args);
});
eventBroadcaster.on('BeforeEachStarted', (args) => {
  console.log('BeforeEachStarted', args);
});
eventBroadcaster.on('TestRunStarted', (args) => {
  console.log('TestRunStarted', args);
});
```

### JavaScript / CucumberJS

Writing a test like this

```gherkin
Feature: Check Inventory
  As a user
  I want to ensure that the inventory page functions correctly
  So that I can manage inventory effectively

  Scenario: Checking the inventory page's appearance
    Given I am on the login page
    When I check the page before login
    And I log in with valid credentials
    And I navigate to the inventory page
    Then I should see the correct inventory page layout

```

```js
const { Given, Then, When } = require('@cucumber/cucumber');
const USERNAME =
  process.env.VISUAL_CHECK === 'true' ? 'visual_user' : 'standard_user';
const PASSWORD = 'secret_sauce';

Given(/^I am on the login page$/, function () {
  return browser.navigateTo('https://www.saucedemo.com');
});

When(/^I check the page before login$/, function () {
  return browser.sauceVisualCheck('Before Login', this);
});

When(/^I log in with valid credentials$/, function () {
  return browser
    .setValue('input[data-test="username"]', USERNAME)
    .setValue('input[data-test="password"]', PASSWORD)
    .click('input[data-test="login-button"]');
});

When(/^I navigate to the inventory page$/, function () {
  return browser.waitForElementVisible('.inventory_list');
});

Then(/^I should see the correct inventory page layout$/, function () {
  return browser.sauceVisualCheck('Inventory Page', this);
});
```

will create this output

```ts
// File customCommand.ts
const EventEmitter = require('events').EventEmitter;

module.exports = class CustomCommand extends EventEmitter {
  async command(name) {
    const nightwatchBrowserObject = this.api;
    console.log(
      'nightwatchBrowserObject.currentTest',
      nightwatchBrowserObject.currentTest,
    );
    // ...
  }
```

```sh
  Using: firefox (120.0.1) on MAC.

nightwatchBrowserObject.currentTest null
..

1 scenario (1 passed)
5 steps (5 passed)
0m05.883s (executing steps: 0m05.845s)
 Wrote HTML report file to: /Users/wimselles/Sauce/Git/hackathon/nightwatch/js-cucumberjs/tests_output/nightwatch-html-report/index.html

✨  Done in 8.80s.
```

This means there is no way to get the test case name based on current logic

In comparison to [JavaScript / Mocha](#javascript--mocha), where the `this` is passed from the test to the custom command, we can **NOT** get this data in the custom command.

Running this with the event listener in the globals we get this

```js
  registerEventHandlers(eventBroadcaster) {
    eventBroadcaster.on('TestSuiteStarted', (args) =>{
        console.log('TestSuiteStarted', args)
    });

    eventBroadcaster.on('TestRunStarted', (args) => {
      console.log('TestRunStarted', args);
    });
  },

```

```sh
TestStarted {
  envelope: { timestamp: { seconds: 1701780659, nanos: 297000000 } },
  report: {
    metadata: {
      protocolVersion: '22.0.0',
      implementation: [Object],
      cpu: [Object],
      os: [Object],
      runtime: [Object],
      ci: undefined
    },
    source: {
      data: 'Feature: Check Inventory\n' +
        '  As a user\n' +
        '  I want to ensure that the inventory page functions correctly\n' +
        '  So that I can manage inventory effectively\n' +
        '\n' +
        "  Scenario: Checking the inventory page's appearance\n" +
        '    Given I am on the login page\n' +
        '    When I check the page before login\n' +
        '    And I log in with valid credentials\n' +
        '    And I navigate to the inventory page\n' +
        '    Then I should see the correct inventory page layout\n',
      uri: 'test/features/nightwatch/saucedemo.feature',
      mediaType: 'text/x.cucumber.gherkin+plain'
    },
    gherkinDocument: [ [Object] ],
    pickle: [ [Object] ],
    stepDefinition: [ [Object], [Object], [Object], [Object], [Object] ],
    hooks: [ [Object], [Object] ],
    testRunStarted: { timestamp: [Object] }
  }
}
TestCaseStarted {
  envelope: {
    attempt: 0,
    testCaseId: 'a05c955b-e58c-425d-a203-4429f9d5dfdf',
    id: 'b219dabd-d786-4b50-b08d-50a5ba44dc1b',
    timestamp: { seconds: 1701780659, nanos: 331000000 }
  },
  report: {
    metadata: {
      protocolVersion: '22.0.0',
      implementation: [Object],
      cpu: [Object],
      os: [Object],
      runtime: [Object],
      ci: undefined
    },
    source: {
      data: 'Feature: Check Inventory\n' +
        '  As a user\n' +
        '  I want to ensure that the inventory page functions correctly\n' +
        '  So that I can manage inventory effectively\n' +
        '\n' +
        "  Scenario: Checking the inventory page's appearance\n" +
        '    Given I am on the login page\n' +
        '    When I check the page before login\n' +
        '    And I log in with valid credentials\n' +
        '    And I navigate to the inventory page\n' +
        '    Then I should see the correct inventory page layout\n',
      uri: 'test/features/nightwatch/saucedemo.feature',
      mediaType: 'text/x.cucumber.gherkin+plain'
    },
    gherkinDocument: [ [Object] ],
    pickle: [ [Object] ],
    stepDefinition: [ [Object], [Object], [Object], [Object], [Object] ],
    hooks: [ [Object], [Object] ],
    testRunStarted: { timestamp: [Object] },
    testCases: [ [Object] ],
    testCaseStarted: { 'b219dabd-d786-4b50-b08d-50a5ba44dc1b': [Object] }
  }
}
```

#### Solution

This event will work for CucumberJS

```js
eventBroadcaster.on('TestCaseStarted', (args) => {
  // Logic to get the feature and scenario name
  const reportData = args.report;
  const testCaseId = reportData.testCaseStarted[args.envelope.id].testCaseId;
  const pickleId = reportData.testCases.find(
    (testCase) => testCase.id === testCaseId,
  ).pickleId;
  const pickleData = reportData.pickle.find((pickle) => pickle.id === pickleId);
  const gherkinDocument = reportData?.gherkinDocument.find(
    (document) => document.uri === pickleData.uri,
  );
  const featureData = gherkinDocument.feature;
  const { name: featureName } = featureData;
  const { name: scenarioName } = pickleData;

  console.log({ featureName, scenarioName });
});
```

It will return

```sh
{
  featureName: 'Check Inventory',
  scenarioName: "Checking the inventory page's appearance"
}
{
  featureName: 'Check Inventory',
  scenarioName: "2 - Checking the inventory page's appearance - 2"
}
```
