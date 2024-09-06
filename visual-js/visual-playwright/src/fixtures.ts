import { TestFixture, TestInfo } from '@playwright/test';
import { Page } from 'playwright-core';
import { SauceVisualParams } from './types';
import { sauceVisualCheck } from './api';

export type SauceVisualFixtures = {
  sauceVisual: {
    visualCheck: (name: string, options?: SauceVisualParams) => Promise<void>;
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
    });
  },
});
