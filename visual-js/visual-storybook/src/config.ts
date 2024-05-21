import type { Config } from '@jest/types';
import { parseOpts, setOpts } from './utils';
import { VisualOpts } from './types';

export const getVisualTestConfig = (
  opts?: Partial<VisualOpts>,
): Partial<Config.InitialOptions> => {
  parseOpts();

  if (opts) {
    setOpts(opts);
  }

  return {
    globalSetup: require.resolve(
      '@saucelabs/visual-storybook/build/config/global-setup.js',
    ),
    globalTeardown: require.resolve(
      '@saucelabs/visual-storybook/build/config/global-teardown.js',
    ),
  };
};
