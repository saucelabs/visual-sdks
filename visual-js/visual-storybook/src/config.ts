import type { Config } from '@jest/types';
import { internals } from '@saucelabs/visual-playwright';
import { VisualOpts } from './types';

const { setOpts, parseOpts } = internals;

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
