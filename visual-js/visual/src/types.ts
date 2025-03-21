import {
  RegionIn,
  ScrollOption,
  SelectorIn,
} from './graphql/__generated__/graphql';
import { SelectiveRegionOptions } from './common/selective-region';
import { SauceRegion } from './common/regions';

export type FullPageScreenshotOptions<T> =
  | boolean
  | {
      /**
       * Delay in ms after scrolling and before taking screenshots.
       * A slight delay can be helpful if the page is using lazy loading when scrolling
       */
      delayAfterScrollMs?: number;
      /**
       * Disable CSS animations and the input caret in the app.
       */
      disableCSSAnimation?: boolean;
      /**
       * Hide elements on the page after first scroll by css selectors.
       */
      hideAfterFirstScroll?: string[];
      /**
       * @deprecated use `hideScrollBars` in CheckOptions instead.
       */
      hideScrollBars?: boolean;
      /**
       * Limit the number of screenshots taken for scrolling and stitching.
       */
      scrollLimit?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
      /**
       * Element used for scrolling (available only in native apps)
       */
      scrollElement?: T | Promise<T>;
      /**
       * Selector of an element that we should crop the screenshot to. Available only on native apps.
       */
      nativeClipSelector?: SelectorIn;
      /**
       * Change scroll behaviour before and after taking full page screenshot. Available only on native apps.
       */
      scrollOption?: ScrollOption;
    };

export type Ignorable<T> = T | T[] | Promise<T> | Promise<T[]> | RegionIn;

export type RegionType<T> = { element: T } & SelectiveRegionOptions;

export type ElementMeta = { id: string; name?: string };

export interface VisualEnvOpts {
  user: string | undefined;
  key: string | undefined;
  region: SauceRegion | undefined;
  /**
   * The build ID for the current run.
   */
  buildId: string | null;
  buildName: string;
  project: string | null;
  branch: string | null;
  defaultBranch: string | null;
  customId: string | null;
}
