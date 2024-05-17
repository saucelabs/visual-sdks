import 'nightwatch';
import {
  DiffingMethod,
  DiffStatus as DiffStatusInternal,
  FullPageScreenshotOptions,
} from '@saucelabs/visual';

const ignoreRegionType: Type<RegionIn> = type({
  width: 'integer',
  height: 'integer',
  x: 'integer',
  y: 'integer',
  'name?': '1<=string<=100 | null | undefined',
});
type IgnoreRegion = typeof ignoreRegionType.infer;
type Ignorable = string | IgnoreRegion;
type CheckOptions = {
  ignore?: Array<Ignorable>;
  diffingMethod?: DiffingMethod;
  fullPage?: FullPageScreenshotOptions;
  /**
   * Whether we should take a snapshot of the DOM to compare with as a part of the diffing process.
   */
  captureDom?: boolean;
  /**
   * A querySelector compatible selector of an element that we should crop the screenshot to.
   */
  clipSelector?: string;
};
type DiffStatusValues = `${DiffStatusInternal}`;

export const DiffStatus = DiffStatusInternal;

declare module 'nightwatch' {
  interface NightwatchAssertions {
    sauceVisualResults: (
      diffStatus: DiffStatusValues,
      expected: number,
    ) => this;
  }
  interface NightwatchCustomCommands {
    sauceVisualCheck(
      name: string,
      options?: CheckOptions,
    ): Awaitable<NightwatchAPI, unknown>;
  }
}
