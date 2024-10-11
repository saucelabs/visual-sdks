import { TestFixture, TestInfo } from '@playwright/test';
import { Page } from 'playwright-core';
import { SauceVisualParams } from './types';
import { sauceVisualCheck, sauceVisualResults } from './playwright';
import { DiffStatus } from '@saucelabs/visual';

export type SauceVisualFixtures = {
  sauceVisual: {
    /**
     * Takes a snapshot of the current page and uploads it to Sauce Labs for visual diffing.
     * @param name
     * @param options
     */
    visualCheck: (name: string, options?: SauceVisualParams) => Promise<void>;
    /**
     * Returns the visual results for the active test. Can only be used inside a
     * `test` or `afterEach` block since it uses the current test context for finding matching
     * visual results.
     */
    sauceVisualResults: () => Promise<Record<DiffStatus, number>>;
  };
};

export const sauceVisualFixtures: (defaultOptions?: SauceVisualParams) => {
  sauceVisual: TestFixture<SauceVisualFixtures['sauceVisual'], { page: Page }>;
} = (defaultOptions) => ({
  sauceVisual: async ({ page }, use, testInfo: TestInfo) => {
    await use({
      visualCheck: async (name, options) => {
        await sauceVisualCheck(page, testInfo, name, {
          ...defaultOptions,
          ...options,
        });
      },
      sauceVisualResults: async () => await sauceVisualResults(testInfo),
    });
  },
});
