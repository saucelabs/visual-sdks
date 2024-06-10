import {
  DiffingMethod,
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
  fullPage?: FullPageScreenshotOptions;
  /**
   * Whether we should take a snapshot of the DOM to compare with as a part of the diffing process.
   */
  captureDom?: boolean;
  /**
   * A querySelector compatible selector of an element that we should crop the screenshot to.
   */
  clipSelector?: string;
}

export interface SauceVisualServiceOptions
  extends Pick<CheckOptions, 'fullPage' | 'captureDom' | 'clipSelector'> {
  buildName?: string;
  project?: string;
  branch?: string;
  defaultBranch?: string;
  failOnFailures?: boolean;
}

export type RunnerSettings = NightwatchTestSettingGeneric & {
  sauceVisualService: SauceVisualServiceOptions;
};
