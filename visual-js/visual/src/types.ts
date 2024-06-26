import { RegionIn } from './graphql/__generated__/graphql';
import { SelectiveRegionOptions } from './selective-region';

export type FullPageScreenshotOptions =
  | boolean
  | {
      /**
       * @deprecated this field will be removed soon
       */
      addressBarShadowPadding?: number;
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
       * Hide all scrollbars in the app.
       */
      hideScrollBars?: boolean;
      /**
       * @deprecated this field will be removed soon
       */
      toolBarShadowPadding?: number;
      /**
       * Limit the number of screenshots taken for scrolling and stitching.
       */
      scrollLimit?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    };

export type Ignorable<T> = T | T[] | Promise<T> | Promise<T[]> | RegionIn;

export type RegionType<T> = { element: T } & SelectiveRegionOptions;

export type ElementMeta = { id: string; name?: string };
