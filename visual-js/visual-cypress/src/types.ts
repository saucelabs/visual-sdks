import { DiffingMethod, SauceRegion } from '@saucelabs/visual';

export interface SauceConfig {
  buildName: string;
  branch?: string;
  defaultBranch?: string;
  project?: string;
  region?: SauceRegion;
  user?: string;
  key?: string;
  diffingMethod?: DiffingMethod;
}

export interface HasSauceConfig {
  saucelabs?: SauceConfig;
}

export type SauceVisualOptions = {
  region: SauceRegion;
};

export type VisualRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualRegionWithRatio = {
  applyScalingRatio?: boolean;
} & VisualRegion;

export type ScreenshotMetadata = {
  id: string;
  name: string;
  testName: string;
  suiteName: string;
  ignoredRegions?: VisualRegionWithRatio[];
  diffingMethod?: DiffingMethod;
  viewport: SauceVisualViewport | undefined;
  devicePixelRatio: number;
  dom?: string;
};

export type SauceVisualViewport = {
  width: number;
  height: number;
};

export type VisualCheckOptions = {
  /**
   * An array of ignore regions or Cypress elements to ignore.
   */
  ignoredRegions?: (VisualRegion | Cypress.Chainable)[];
  /**
   * The diffing method we should use when finding visual changes. Defaults to DiffingMethod.Simple.
   */
  diffingMethod?: DiffingMethod;
  /**
   * Enable DOM capture for DOM Inspection and insights.
   */
  captureDom?: boolean;
  /**
   * An HTML selector we should clip to. Can be used for basic component testing
   * / screenshot cropping. Ex: '.class_name', '#id_name', etc
   */
  clipSelector?: string;
  /**
   * Additional options to pass to the Cypress screenshot command.
   */
  cypress?: Partial<
    Cypress.Loggable & Cypress.Timeoutable & Cypress.ScreenshotOptions
  >;
};
