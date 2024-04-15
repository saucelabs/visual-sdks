# Sauce Labs Visual Storybook Integration

An extension for [Storybook's test-runner](https://github.com/storybookjs/test-runner) to integrate effortless visual testing with Sauce Labs Visual.

## Compatibility

This package leverage's Storybook's test-runner and metadata generation system for enabling automatic testing of Storybook stories. We recommend running Storybook `^7.0.0 || ^8.0.0` and an up-to-date version of the Storybook `test-runner` (`>=0.17.0` at time of writing).

## Getting Started

1. Follow [Storybook's instructions](https://github.com/storybookjs/test-runner/blob/next/README.md#getting-started) for setting up, installing, and configuring the test-runner if you haven't done so already. If you have already used or enabled the test-runner, you can skip this step.


2. Install the saucelabs visual-storybook plugin:

```shell
npm i -D @saucelabs/visual-storybook
```

3. Eject your test-runner config and append the Sauce Visual storybook configuration:

If you already have a custom config file for the test-runner you can skip to the next step for appending our configuration bootstrap. If not see below or read through [the docs](https://github.com/storybookjs/test-runner#ejecting-configuration) to eject the default test configuration.

```shell
npx test-storybook --eject
```

The above should have created a file in the root directory, `test-runner-jest.config.js`. Edit this file and add an import for the sauce visual plugin: `const { getVisualTestConfig } = require('@saucelabs/visual-storybook');`, then append `...getVisualTestConfig(),` below the jest config spread. Your file should look similar to the example below:

```js
// test-runner-jest.config.js
const { getJestConfig } = require('@storybook/test-runner');
const { getVisualTestConfig } = require('@saucelabs/visual-storybook');

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  // The default configuration comes from @storybook/test-runner
  ...getJestConfig(),
  // The configuration for Sauce Lab's Visual Integration
  ...getVisualTestConfig(),
  /** Add your own overrides below
   * @see https://jestjs.io/docs/configuration
   */
};
```

4. Create a `test-runner.js` file in your storybook configuration directory (`<root>/.storybook` by default) if you do not already have one, and append our `postVisit` hook into it. You can read more about this file in the [hook API section](https://github.com/storybookjs/test-runner#experimental-test-hook-api). It should look something like below:


```js
// .storybook/test-runner.js
const { postVisit } = require('@saucelabs/visual-storybook');

module.exports = {
  postVisit,
};
```

5. Run your Storybook instance (or point to a built one), set the required environment variables ([see here](#customizing-your-builds-environment-variables) for all available / required fields), and run the test-runner! We'll take snapshots of all known Storybook stories and upload them into Sauce Visual.

```shell
# Spin up your storybook instance in a separate terminal window if you're not using a live / 
# hosted one
npm run storybook

# Export your username and access key or set them in your CI variables. You can get these from 
# app.saucelabs.com
export SAUCE_USERNAME=__YOUR_SAUCE_USER_NAME__
export SAUCE_ACCESS_KEY=__YOUR_SAUCE_ACCESS_KEY__

# Run the storybook command! Note: if you're running against a non-standard port or URL, you'll 
# need to supply the --url parameter followed by the root url for your storybook instance. See the
# test-runner docs for more details / examples of config parameters. 
# ex: --url http://localhost:6006
npx test-storybook
```

6. Review your changes in the [Sauce Labs Visual Dashboard](https://app.saucelabs.com/visual/builds)!

## Customizing Your Builds (Environment Variables)

Below are the environment variables available in the visual-storybook plugin:

| Variable Name               |          | Description                                                                                                                                                                                                                                                                                           |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SAUCE_USERNAME`            | required | Your Sauce Labs username. You can get this from the header of app.saucelabs.com                                                                                                                                                                                                                       |
| `SAUCE_ACCESS_KEY`          | required | Your Sauce Labs access key. You can get this from the header of app.saucelabs.com                                                                                                                                                                                                                     |
| `SAUCE_REGION`              |          | The region you'd like to run your Visual tests in. Defaults to `us-west-1` if not supplied. Can be one of the following: <br/> `'eu-central-1', 'us-west-1' or 'us-east-4'`                                                                                                                           |
| `SAUCE_BUILD_NAME`          |          | The name you would like to appear in the Sauce Labs Visual dashboard. Defaults to 'Storybook Build'                                                                                                                                                                                                   |
| `SAUCE_BRANCH_NAME`         |          | The branch name or tag you would like to associate this build with. We recommend using your current VCS branch in CI.                                                                                                                                                                                 |
| `SAUCE_DEFAULT_BRANCH_NAME` |          | A secondary branch that is also considered for baseline matching. This is usually the default git branch.                                                                                                                                                                                             |  |
| `SAUCE_PROJECT_NAME`        |          | The label / project you would like to associated this build with.                                                                                                                                                                                                                                     |
| `SAUCE_VISUAL_BUILD_ID`     |          | For advanced users, a user-supplied SauceLabs Visual build ID. Can be used to create builds in advance using the GraphQL API. This can be used to parallelize tests with multiple browsers, shard, or more. <br/> By default, this is not set and we create / finish a build during setup / teardown. |
| `SAUCE_VISUAL_CUSTOM_ID`    |          | For advanced users, a user-supplied custom ID to identify this build. Can be used in CI to identify / check / re-check the status of a single build. Usage suggestions: CI pipeline ID.                                                                                                               |

## Story / Global Configuration

Additional configuration options are exposed via the `sauceVisual` [Storybook parameters](https://storybook.js.org/docs/writing-stories/parameters). You can use these to tweak settings on a global, component, or per-story basis -- see the Storybook docs for details on how to apply them to each.

The below configuration options are also exported as the type `SauceVisualParams` from `@saucelabs/visual-storybook` if you'd like TypeScript types for them.

Parameters key: `sauceVisual`

| Key             | Type                       | Default           | Description                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `captureDom`    | `boolean`                  | `false`           | Enables DOM snapshot capture.                                                                                                                                                                                                                                                                                                             |
| `clip`          | `boolean`                  | `true`            | If the story & layout supports it, will automatically clip to the `clipSelector` to remove extraneous whitespace. Recommended to be used in conjunction with [`centered` layout](https://storybook.js.org/docs/configure/story-layout#global-layout). Currently defaults to `false`, however, will default to `true` in a future version. |
| `clipSelector`  | `string`                   | `#storybook-root` | The selector to clip to when `clip = true`. Defaults to Storybook's default root element, `#storybook-root`.                                                                                                                                                                                                                              |
| `delay`         | `number`                   | `0` (no delay)    | A number, in ms, that we should delay the snapshot by. Useful if the beginning of the story has unavoidable / javascript animations.                                                                                                                                                                                                      |
| `ignoreRegions` | `(string  \|  RegionIn)[]` | `[]`              | An array of selectors (or ignore region shapes) for one or more elements or regions on the page to ignore. Can be used to ignore ever-changing or dynamic pieces of content on the page. Shape for custom-defined ignore regions: `{height: number, width: number, x: number, y: number, name?: string}`                                  |

Component-level Example: 

```jsx
const meta = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    // ... Your other Storybook parameters here
    sauceVisual: {
      // Add storybook visual configuration options here
      clip: true,
      // clipSelector: '#custom-root-element',
      // delay: 200,
      // ignoreRegions: [
      //   '#element-selector',
      //   { // Or custom-defined ignore region
      //     height: 200,
      //     width: 200,
      //     x: 150,
      //     y: 300,
      //     name: 'Sample ignore region',
      //   },
      // ],
    },
  },
};

export default meta;
```

## Auto Testing Variations 

We have a separate Storybook plugin, `@saucelabs/storybook-variants`, available for rendering all variants of a component to ease the testing and development process. Read the full [README on NPM](https://www.npmjs.com/package/@saucelabs/storybook-variants) for installation & usage.

# Changelog

## 0.3.326

The default clipping behaviour changed to true. This will make sure images are clipped to the boundary of components instead of capturing the whole viewport. This change will affect all non clipped baselines created with previous sdk versions. Either recreating the baselines is needed (recommended) or changing the config to false.
