# Sauce Labs Visual for Nightwatch

This package is Sauce Labs Visual integration for Nightwatch.<br />
It comes as a service that you can add to your existing Nightwatch project.

It will extend Nightwatch's `browser` object with two new commands:

- `browser.sauceVisualCheck()`: Takes a screenshot and sends it to Sauce Labs Visual for comparison.
- `browser.sauceVisualResults()`: Returns how many changes have been observed.

## Quickstart

### Step 1: Add Sauce Labs Visual dependency

Install the Sauce Labs Visual service in your current project.

```sh
npm install --save @saucelabs/nightwatch-sauce-visual-service
```

**NOTE:** When you are using TypeScript, you will need to add the following to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "types": [
        ...
        "@saucelabs/nightwatch-sauce-visual-service"
        ...
    ]
  }
}
```

### Step 2: Add SauceVisualService to your Nightwatch configuration

Add the `SauceVisualService` to your existing configuration (E.g. `nightwatch.conf.(js|ts)`) :

```ts
// ...
module.exports = {
  // ...
  // Add the service
  plugins: [
    // ... other plugins
    '@saucelabs/nightwatch-sauce-visual-service',
  ],
  // ...
  test_settings: {
    // ...
    default: {
      // ...
      sauceVisualService: {
        buildName: 'Nightwatch Visual Demo Test',
        project: 'Nightwatch Project',
        branch: 'feature',
        defaultBranch: 'main',
      },
      // ...
    },
    // ...
  },
  // ...
};
```

> **NOTE:** The `sauceVisualService` object is required for Sauce Labs Visual to work. This service will automatically check if your are running your tests on Sauce Labs platform and will only run if it is the case.

### Step 3: Add visual tests to your project

Add a check to one of your tests:

#### Default Nightwatch TestRunner

```ts
import { NightwatchTests } from 'nightwatch';

const home: NightwatchTests = {
  'Sauce Demo test': () => {
    browser.url('https://saucedemo.com').sauceVisualCheck('Home Page').end();
  },
};

export default home;
```

#### Mocha TestRunner

```ts
describe('Saucedemo example', function () {
  it('Check Home Page - 1', (browser) => {
    browser
      .url('https://saucedemo.com')
      // NOTE: adding the `this` context is required for the service
      // to properly pass the suite and testname to Sauce Labs Visual
      .sauceVisualCheck('Home Page - 1', this);
  });
});
```

#### CucumberJS TestRunner

```ts
const { Given } = require('@cucumber/cucumber');

Given(/^I am on the login page$/, function () {
  return browser.navigateTo('https://www.saucedemo.com');
});
// ...
```

### Step 4: Configure your Sauce Labs credentials

Sauce Labs Visual relies on environment variables for authentications.<br />
Both `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` need to be set prior starting your Nightwatch job.

Username and Access Key can be retrieved from https://app.saucelabs.com/user-settings.

```sh
export SAUCE_USERNAME=__YOUR_SAUCE_USER_NAME__
export SAUCE_ACCESS_KEY=__YOUR_SAUCE_ACCESS_KEY__
```

### Step 5: Run the test

Everything is now configured, your tests can be run as any other Nightwatch project.

Builds will appear on Sauce Labs platform as soon as they have been created by the running tests: https://app.saucelabs.com/visual/builds.

At the end of the build, a summary will be displayed in the console:

```sh
┌───────┬────────────┐
│ Count │ Status     │
├───────┼────────────┤
│ 0     │ Approved   │
├───────┼────────────┤
│ 1     │ Equal      │
├───────┼────────────┤
│ 0     │ Queued     │
├───────┼────────────┤
│ 5     │ Unapproved │
├───────┼────────────┤
│ 0     │ Rejected   │
└───────┴────────────┘
```

## Add to New Project

### Step 1: Create a new Nightwatch project

Create a new Nightwatch project:

```sh
mkdir my-nightwatch-project
cd my-nightwatch-project
npm init nightwatch
```

then follow the instructions.

```sh
===============================
Nightwatch Configuration Wizard
===============================

Setting up Nightwatch in /Users/Sauce/nightwatch-example...

? Select testing type to setup for your project: `End-to-End testing`
? Select language + test runner variant: `TypeScript / default`
? Select target browsers: `Chrome`
? Enter source folder where test files are stored: `test`
? Enter the base_url of the project: `https://www.saucedemo.com`
? Select where to run Nightwatch tests: `On localhost`
? Allow Nightwatch to collect completely anonymous usage metrics?: `No`
? Setup testing on Mobile devices as well?: `No, skip for now`
```

Now follow the instructions in [Step 2](#step-2-add-sauce-labs-visual-dependency) and the rest of the [Quickstart](#quickstart) guide.

## Advanced Usage

### Sauce Visual Assertion

**NOTE:** This feature is only available when using the `default` and `CucumberJS` TestRunners. It is not available when using the `mocha` TestRunner.

At the end of each Test you can assert the status of all the visual comparisons that have been made during the test. Sauce Visual will return a summary of the test results in this format:

```
{
    QUEUED: number;     // Diffs that are pending for processing. Should be 0 in case the test is completed without any timeouts
    EQUAL: number;      // Diffs that have no changes detected
    UNAPPROVED: number; // Diffs that have detected changes and waiting for action
    APPROVED: number;   // Diffs that have detected changes and have been approved
    REJECTED: number;   // Diffs that have detected changes and have been rejected
}
```

By using the following assertion you can make sure that all the visual comparisons have been completed and approved:

```ts
import { NightwatchTests } from 'nightwatch';
import { DiffStatus } from '@saucelabs/nightwatch-sauce-visual-service';

const home: NightwatchTests = {
  'Check Inventory Page': () => {
    browser
      .url('https://saucedemo.com')
      .setValue('input[data-test="username"]', 'standard_user')
      .setValue('input[data-test="password"]', 'secret_sauce')
      .click('input[data-test="login-button"]')
      .waitForElementVisible('.inventory_list')
      .sauceVisualCheck('Inventory Page')
      .click('[data-test="add-to-cart-sauce-labs-backpack"]')
      .sauceVisualCheck('Added backpack to cart')
      // Here we validate that we don't have any unapproved visual changes
      // See status codes above
      .assert.sauceVisualResults(DiffStatus.Unapproved, 0);
  },
};

export default home;
```

### Build attributes

When creating the service in Nightwatch's configuration, extra fields can be set to define the context, thus acting on which baselines new snapshots will be compared. ([More info on baseline matching](https://docs.saucelabs.com/visual-testing/#baseline-matching))

Options:

- `buildName`: Name of the build
- `project`: Name of the project
- `branch`: Name of branch
- `defaultBranch`: Name of default branch
- `captureDom`: Enable DOM capture globally, can also be enabled on a per-screenshot basis

Example:

```ts
// ...
module.exports = {
  // ...
  // ...
  test_settings: {
    // ...
    default: {
      // ...
      sauceVisualService: {
        buildName: 'Nightwatch Visual Demo Test',
        project: 'Nightwatch Project',
        branch: 'main',
        // captureDom: true,
      },
      // ...
    },
    // ...
  },
  // ...
};
```

### Ignored regions

In the case you need to ignore some region when running your tests, Sauce Visual provides a way to ignore user-specified areas.

Those ignored regions are specified when requesting a new snapshot.

#### Component-based ignored region

You can ignore elements from the page based on providing a component by its selector or by a page object reference (if you are using page objects).

Example:

```ts
const page = browser.page.homePage();
await browser.sauceVisualCheck('Home Page', {
  ignore: [
    // If you are using page objects
    page.elements.username.selector,
    //
    // NOTE: You can't use the normal page object syntax, like '@username' here. Please use the above.
    // If you do use the normal syntax, then the service will filter out the property, not use it and log a warning like
    //  Ignoring page object reference: '@username'. Please use the 'pageObjectName.elements.username.selector' annotation.
    //
    // If you prefer selectors
    'input[data-test="password"]',
  ],
});
```

#### User-specified ignored region

Alternatively, an ignored region can be a specific region that is defined by four elements.

- `x`, `y`: The location of the top-left corner of the ignored region
- `width`: The width of the region to ignore
- `height: The height of the region to ignore

_Note: all values are pixels_

Example:

```ts
browser
  .url('https://saucedemo.com')
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
```

### Fail on failures

By default, Sauce Visual will not fail the test if there are any failures during the comparison process. A failure will be logged in the Sauce Labs Visual dashboard, but the test will continue to run.

If you want to fail the test when there are failures, you can set the `failOnFailures` option to `true`:

```ts
// ...
module.exports = {
  // ...
  // ...
  test_settings: {
    // ...
    default: {
      // ...
      sauceVisualService: {
        failOnFailures: true, // Default is false
      },
      // ...
    },
    // ...
  },
  // ...
};
```
