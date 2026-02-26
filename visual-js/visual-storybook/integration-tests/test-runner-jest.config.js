import { getJestConfig } from '@storybook/test-runner';
import { getVisualTestConfig } from "@saucelabs/visual-storybook";

// The default Jest configuration comes from @storybook/test-runner
const testRunnerConfig = getJestConfig();

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
export default {
  ...testRunnerConfig,
  ...getVisualTestConfig(),
  testEnvironmentOptions: {
    'jest-playwright': {
      useDefaultBrowserType: true,
      browsers: ['chromium'],
      devices: ['Desktop Chrome'],
    },
  },
  /** Add your own overrides below, and make sure
   *  to merge testRunnerConfig properties with your own
   * @see https://jestjs.io/docs/configuration
   */
};
