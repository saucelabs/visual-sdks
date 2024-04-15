/* eslint-disable no-var */
import { getApi } from '@saucelabs/visual';

declare global {
  var visualApi: ReturnType<typeof getApi>;
  var buildId: string;
}
