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

  testEnvironmentOptions: {
    'jest-playwright': {
      useDefaultBrowserType: true,
      browsers: ['chromium'],
      devices: ['Desktop Chrome'],
    },
  },

  /** Add your own overrides below
   * @see https://jestjs.io/docs/configuration
   * @see https://github.com/playwright-community/jest-playwright#configuration
   */
};
