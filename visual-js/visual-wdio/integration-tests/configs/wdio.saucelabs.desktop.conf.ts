import type { Options } from '@wdio/types';
import { config as sauceSharedConfig } from './wdio.saucelabs.shared.conf.ts';

const buildName = `Sauce Demo Test - ${new Date().getTime()}`;

export const config: Options.Testrunner = {
  ...sauceSharedConfig,
  //
  // ============
  // Capabilities
  // ============
  capabilities: [
    {
      browserName: 'chrome',
      browserVersion: 'latest',
      platformName: 'Windows 11',
      'sauce:options': {
        screenResolution: '2560x1600',
        build: buildName,
      },
    },
  ],
  // =====
  // Hooks
  // =====
  before: async (_capabilities, _specs) => {
    // Set all browsers to the "same" viewport
    await browser.setWindowRect(null, null, 1920, 1080);
  },
};
