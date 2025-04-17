import {
  DiffingMethod,
  DiffingMethodSensitivity,
  DiffingMethodToleranceIn,
  FullPageScreenshotOptions,
  getApi,
  RegionIn,
  RegionType,
} from '@saucelabs/visual';
import type {
  Elements,
  NightwatchTestSettingGeneric,
  ScopedElement,
} from 'nightwatch';

declare global {
  var uploadedDiffIds: string[];
  var skipped: number;
}

export type ElementType = ScopedElement | Elements;

export type NightwatchIgnorable =
  | ScopedElement
  | Elements
  | string
  | string[]
  | RegionIn;

export type SauceVisualAPI = ReturnType<typeof getApi>;

export interface CheckOptions {
  ignore?: NightwatchIgnorable[];
  regions?: RegionType<ElementType>[];
  diffingMethod?: DiffingMethod;
  diffingMethodTolerance?: DiffingMethodToleranceIn;
  diffingMethodSensitivity?: DiffingMethodSensitivity;
  fullPage?: FullPageScreenshotOptions<ScopedElement>;
  /**
   * Whether we should take a snapshot of the DOM to compare with as a part of the diffing process.
   */
  captureDom?: boolean;
  /**
   * A querySelector compatible selector of an element that we should crop the screenshot to.
   */
  clipSelector?: string;
  /**
   * A NightwatchElement that we should crop the screenshot to. Takes priority over a clipSelector
   */
  clipElement?: ScopedElement;
  /**
   * Hide all scrollbars in the web app. Default value is `true`.
   */
  hideScrollBars?: boolean;
}

export interface SauceVisualServiceOptions
  extends Pick<
    CheckOptions,
    | 'fullPage'
    | 'captureDom'
    | 'clipSelector'
    | 'hideScrollBars'
    | 'diffingMethodSensitivity'
    | 'diffingMethodTolerance'
    | 'diffingMethod'
  > {
  buildName?: string;
  project?: string;
  branch?: string;
  defaultBranch?: string;
  failOnFailures?: boolean;
}

export type RunnerSettings = NightwatchTestSettingGeneric & {
  sauceVisualService: SauceVisualServiceOptions;
};
