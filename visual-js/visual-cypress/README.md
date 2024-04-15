# Sauce Labs Visual for Cypress

## Introduction

This package is Sauce Labs Visual integration for Cypress.<br />
It comes as both a plugin and commands that will be made available for your tests.

It will introduce a new Cypress command:
- `cy.sauceVisualCheck()`: Takes a screenshot and send it to Sauce Labs Visual for comparison.

> **Warning:**
> `cy.visualCheck()` has been deprecated and will be removed in a future version.

## Quickstart

### Step 1: Add Sauce Visual for Cypress dependency

- Install the Sauce Visual for Cypress plugin in your current project.

```sh
npm install --save @saucelabs/cypress-visual-plugin
```

### Step 2: Configure Cypress to use Sauce Visual for Cypress plugin

- Import the plugin in Cypress project configuration, at the top of the file:
```ts
import { CypressSauceVisual } from '@saucelabs/cypress-visual-plugin';
```

- Register the plugin to Cypress events in Cypress project configuration:

``` ts
export default defineConfig({
  e2e: {
    [...]
    setupNodeEvents(on, config) {
      CypressSauceVisual.register(on, config);
    },
  },
})
```

- Register Sauce Visual for Cypress commands. Add the following line in your `cypress/support/e2e.ts`:
```ts
import '@saucelabs/cypress-visual-plugin/commands';
```


- (TypeScript Users) Add `@saucelabs/cypress-visual-plugin/commands` to your `compilerOptions/types` in `tsconfig.json` for typed commands:
```json
{
  "compilerOptions": {
    "types": ["cypress", "node", "@saucelabs/cypress-visual-plugin/commands"]
  }
}
```

### Step 3: Add visual tests in your project:

```ts
context('Sauce Demo', () => {
  it('should render correctly', () => {
    ...
    cy.sauceVisualCheck('visual: my-homepage');
    ...
  })
});
```


### Step 4: Configure your Sauce Labs credentials

Sauce Visual relies on environment variables for authentications.<br />
Both `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` need to be set prior starting your WebdriverIO job.

Username and Access Key can be retrieved from https://app.saucelabs.com/user-settings.

```sh
export SAUCE_USERNAME=__YOUR_SAUCE_USER_NAME__
export SAUCE_ACCESS_KEY=__YOUR_SAUCE_ACCESS_KEY__
```

### Step 5: Run the test

Everything is now configured, your tests can be run as any other Cypress project.

Builds will appear on Sauce Labs platform as soon as they have been created by the running tests: https://app.saucelabs.com/visual/builds.

## Advanced usage

### Build name

Sauce Visual for Cypress plugin extends Cypress configuration, allowing to define the context, thus acting on which baselines new snapshots will be compared to. ([More info on baseline matching](../sauce-visual.md#baseline-matching))

Options:
- `region`: Sauce Labs Region where the new build will be created (default: `us-west-1`)
- `buildName`: Name of the build (default: `Cypress Visual Testing`)
- `project`: Name of the project (default: `None`)
- `branch`: Name of branch (default: `None`)
- `defaultBranch`: Name of the main or default branch (default: `None`)

They need to be set through the `saucelabs` attribute of `e2e` configuration.

Example:
```javascript
export default defineConfig({
  e2e: {
    [...]
    saucelabs: {
      region: 'eu-central-1',
      buildName: 'SauceDemo - Cypress',
      project: 'Cypress examples',
      branch: 'feature',
      defaultBranch: 'main',
    },
    [...]
  }
}
```

### Ignored regions

In the case you need to ignore some region when running your tests, Sauce Visual provides a way to ignore user-specified areas.

Those ignored regions are specified when requesting a new snapshot.

#### User-specified ignored region

A region is defined by four elements.
- `x`, `y`: The location of the top-left corner of the ignored region
- `width`: The width of the region to ignore
- `height`: The heigh of the region to ignore

*Note: all values are pixels*

Example:
```javascript
    cy.sauceVisualCheck('login-page', {
      ignoredRegions: [
        {
          x: 240,
          y: 800,
          width: 1520,
          height: 408
        }
      ],
    });
```

#### Component-based ignored region

Alternatively, an ignored region can be a specific element from the page.

If the selectors matches multiple elements, all will be ignored.

Example:
```javascript
    cy.sauceVisualCheck('login-page', {
      ignoredRegions: [
        cy.get('[data-test="username"]'),
      ]
    });
```

### Specifying options for Cypress Screenshot

Sauce Visual is relying on native screenshot feature from Cypress. As `cy.snapshot` has option, they can be specified in the `cy.visualCheck` command.

The field `cypress` from `options` will be transmitted as it to `cy.screenshot` command.

Example:
```javascript
    cy.sauceVisualCheck('login-page', {
      cypress: {
        capture: 'viewport',
      }
    });
```

### Capturing the dom snapshot

Sauce Visual doesn't capture dom snapshot by default. It can be changed in `sauceVisualCheck` options.

Example:
```javascript
    cy.sauceVisualCheck('login-page', {
        captureDom: true
    });
```

## Limitations

Sauce Visual for Cypress **DOES NOT** support `cypress open`.

Screenshots will be captured and sent to Sauce Labs only when `cypress run` is executed.
