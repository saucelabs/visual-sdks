import type {
  DiffingMethod,
  DiffingMethodSensitivity,
  DiffingMethodToleranceIn,
  DiffingOptionsIn,
  RegionIn,
  VisualEnvOpts,
  BaselineOverrideIn,
} from '@saucelabs/visual';
import { PageScreenshotOptions } from 'playwright-core';

export type StringFromEnum<T extends string> = `${T}`;

export interface SauceVisualParams {
  screenshotOptions?: Pick<
    PageScreenshotOptions,
    'animations' | 'caret' | 'fullPage' | 'style' | 'timeout'
  >;
  /**
   * Whether we should capture a dom snapshot.
   */
  captureDom?: boolean;
  /**
   * A custom selector to clip to.
   */
  clipSelector?: string;
  /**
   * A number, in ms, that we should delay before taking the snapshot.
   */
  delay?: number;
  /**
   * One or more regions on the page to ignore. Used to block dynamic or ever-changing content you
   * don't want to diff.
   */
  ignoreRegions?: (RegionIn | string)[];
  /**
   * The diffing method we should use when finding visual changes. Defaults to DiffingMethod.Balanced
   */
  diffingMethod?: StringFromEnum<DiffingMethod>;
  diffingMethodTolerance?: DiffingMethodToleranceIn;
  diffingMethodSensitivity?: StringFromEnum<DiffingMethodSensitivity>;
  diffingOptions?: DiffingOptionsIn;
  baselineOverride?: BaselineOverrideIn;
}

export interface PlaywrightEnvOpts extends VisualEnvOpts {
  /**
   * Whether this build was created externally and provided via an ENV (sharding, concurrency).
   */
  externalBuildId: boolean;
}
