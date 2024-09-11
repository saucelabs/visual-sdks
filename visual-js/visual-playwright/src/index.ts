export {
  sauceVisualSetup,
  sauceVisualTeardown,
  sauceVisualCheck,
} from './playwright';
export { sauceVisualFixtures, SauceVisualFixtures } from './fixtures';
export { SauceVisualParams } from './types';
import { VisualPlaywright } from './api';
import { getOpts, setOpts, parseOpts } from './utils';

/**
 * One or more internal functions / utilities exported to reduce code duplication. Not intended for
 * end users.
 */
export const internals = {
  VisualPlaywright,
  getOpts,
  setOpts,
  parseOpts,
};
