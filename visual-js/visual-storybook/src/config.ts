import type { Config } from '@jest/types';
import { VisualOpts } from './types';
import { VisualStorybook } from './api';

export const getVisualTestConfig = (
  opts?: Partial<VisualOpts>,
): Partial<Config.InitialOptions> => {
  VisualStorybook.globalSetup(opts);
  return {
    globalSetup: require.resolve(
      '@saucelabs/visual-storybook/build/config/global-setup.js',
    ),
    globalTeardown: require.resolve(
      '@saucelabs/visual-storybook/build/config/global-teardown.js',
    ),
  };
};
