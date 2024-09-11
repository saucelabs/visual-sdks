import VisualPlaywright from './api';
import type { Page } from 'playwright-core';
import { TestInfo } from '@playwright/test';
import { SauceVisualParams } from './types';

export const sauceVisualSetup = VisualPlaywright.setup.bind(VisualPlaywright);
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
