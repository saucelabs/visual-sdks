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
    },
    name,
    options,
  );
