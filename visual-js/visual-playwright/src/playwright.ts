import VisualPlaywright from './api';
import type { Page } from 'playwright-core';
import { TestInfo } from '@playwright/test';
import { SauceVisualParams } from './types';
import { VisualEnvOpts } from '@saucelabs/visual';

export const sauceVisualSetup = async (opts?: Partial<VisualEnvOpts>) => {
  VisualPlaywright.globalSetup(opts);
  return VisualPlaywright.setup();
};
export const sauceVisualTeardown =
  VisualPlaywright.teardown.bind(VisualPlaywright);

/**
 * Takes a snapshot of the current page and uploads it to Sauce Labs for visual diffing.
 */
export const sauceVisualCheck = async (
  page: Page,
  testInfo: TestInfo,
  name: string,
  options?: Partial<SauceVisualParams>,
) =>
  await VisualPlaywright.takePlaywrightScreenshot(
    page,
    {
      deviceName: testInfo.project.name,
      testName: testInfo.title,
      suiteName: testInfo.titlePath.slice(0, -1).join('/'),
      testId: testInfo.testId,
    },
    name,
    options,
  );

/**
 * Returns the visual results for the active test. Can only be used inside a
 * `test` or `afterEach` block since it uses the current test context for finding matching
 * visual results.
 */
export const sauceVisualResults = async (testInfo: TestInfo) =>
  await VisualPlaywright.visualResults({
    testId: testInfo.testId,
  });
