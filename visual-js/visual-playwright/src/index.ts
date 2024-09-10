export { sauceVisualCheck } from './api';
export { sauceVisualSetup, sauceVisualTeardown } from './setup-teardown';
export { sauceVisualFixtures, SauceVisualFixtures } from './fixtures';
export { SauceVisualParams } from './types';

import { takePlaywrightScreenshot, getApi } from './api';
import { getOpts, parseOpts, setOpts } from './utils';

/**
 * One or more internal functions / utilities exported to reduce code duplication. Not intended for
 * end users.
 */
export const internals = {
  takePlaywrightScreenshot,
  getOpts,
  getApi,
  parseOpts,
  setOpts,
};
