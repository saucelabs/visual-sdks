import type { SauceVisualParams as PlaywrightParams } from '@saucelabs/visual-playwright';
import { instrument } from '@storybook/instrumenter';

const _takeVisualSnapshot = async (
  name: string,
  params?: PlaywrightParams,
): Promise<void> => {
  /**
   * @see https://github.com/storybookjs/test-runner?tab=readme-ov-file#storybooktestrunner-user-agent
   */
  const isTestRunner = window.navigator.userAgent.match(/StorybookTestRunner/);

  if (!isTestRunner) {
    console.info(
      'Skipping Sauce Visual snapshot -- not in test runner context.',
    );
    return;
  }
  if (!window.takeVisualSnapshot) {
    throw new Error(
      '`takeVisualSnapshot` is not available. Did you setup your `preVisit` hook for Sauce Labs in your Storybook test-runner.js/ts configuration file?',
    );
  }
  await window.takeVisualSnapshot(name, params);
};

export const {
  /**
   * Takes a screenshot with Sauce Visual. Designed to be used only within the Storybook Test Runner
   * execution. Is noop when not in the test runner.
   * @param name
   * @param params
   */
  takeVisualSnapshot,
} = instrument(
  {
    takeVisualSnapshot: _takeVisualSnapshot,
  },
  {
    intercept: true,
  },
);
