/* eslint-disable no-var */
import { getApi } from '@saucelabs/visual';

declare global {
  var visualApi: ReturnType<typeof getApi>;
  var buildId: string;

  interface Window {
    styleMap:
      | Map<
          HTMLElement,
          { height: string; maxHeight: string; overflowY: string }
        >
      | undefined;
  }
}
