import type { Config } from '@jest/types';
import { VisualOpts } from './types';
import { VisualStorybook } from './api';

export const getVisualTestConfig = (
  opts?: Partial<VisualOpts>,
): Partial<Config.InitialOptions> => {
  VisualStorybook.globalSetup(opts);
  return {
    globalSetup: import.meta.resolve(
      '@saucelabs/visual-storybook/build/config/global-setup.js',
    ),
    globalTeardown: import.meta.resolve(
      '@saucelabs/visual-storybook/build/config/global-teardown.js',
    ),
  };
};
