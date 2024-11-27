/* eslint-disable no-var */
import type { getApi } from '@saucelabs/visual';
import type { SauceVisualParams as PlaywrightParams } from '@saucelabs/visual-playwright';

declare global {
  var visualApi: ReturnType<typeof getApi>;
  var buildId: string;
  interface Window {
    takeVisualSnapshot?: (
      name: string,
      opts?: PlaywrightParams,
    ) => Promise<void>;
  }
}
