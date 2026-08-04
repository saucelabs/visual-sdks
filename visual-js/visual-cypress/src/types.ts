import type {
  BaselineOverrideIn,
  Browser,
  DiffingMethod,
  DiffingMethodSensitivity,
  DiffingMethodToleranceIn,
  DiffingOptionsIn,
  OperatingSystem,
  SauceRegion,
  SelectiveRegionOptions,
} from '@saucelabs/visual';

/**
 * A browser-safe form of `BaselineOverrideIn`. Cypress specs run in the browser and cannot import
 * runtime values such as the `Browser` and `OperatingSystem` enums, so those fields accept their
 * string values instead.
 */
export type VisualBaselineOverride = Omit<
  BaselineOverrideIn,
  'browser' | 'operatingSystem'
> & {
  browser?: `${Browser}` | null;
  operatingSystem?: `${OperatingSystem}` | null;
};

export interface SauceConfig {
  buildName: string;
  branch?: string;
  defaultBranch?: string;
  project?: string;
  region?: SauceRegion;
  user?: string;
  key?: string;
  diffingMethod?: DiffingMethod | `${DiffingMethod}`;
  diffingOptions?: DiffingOptionsIn;
  diffingMethodTolerance?: DiffingMethodToleranceIn;
  diffingMethodSensitivity?:
    | DiffingMethodSensitivity
    | `${DiffingMethodSensitivity}`;
  baselineOverride?: VisualBaselineOverride;
}

export interface HasSauceConfig {
  saucelabs?: SauceConfig;
}

export type SauceVisualOptions = {
  region: SauceRegion;
};

export type PlainRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualRegion<
  R extends Omit<object, 'element'> = PlainRegion | Cypress.Chainable,
> = { element: R } & SelectiveRegionOptions;

export type ResolvedVisualRegion = VisualRegion<PlainRegion>;

export type ScreenshotMetadata = {
  id: string;
  name: string;
  testName: string;
  suiteName: string;
  regions: ResolvedVisualRegion[];
  diffingMethod?: DiffingMethod | `${DiffingMethod}`;
  diffingOptions?: DiffingOptionsIn;
  diffingMethodTolerance?: DiffingMethodToleranceIn;
  diffingMethodSensitivity?:
    | DiffingMethodSensitivity
    | `${DiffingMethodSensitivity}`;
  baselineOverride?: VisualBaselineOverride;
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
  ignoredRegions?: (PlainRegion | Cypress.Chainable)[];
  /**
   * The diffing method we should use when finding visual changes. Defaults to DiffingMethod.Balanced
   */
  diffingMethod?: `${DiffingMethod}`;
  /**
   * The diffing options that should be applied by default.
   */
  diffingOptions?: DiffingOptionsIn;
  /**
   * Controls one or more of the options available to adjust the sensitivity of supported diffing
   * methods.
   */
  diffingMethodTolerance?: DiffingMethodToleranceIn;
  /**
   * Use one of a few presets from Sauce Labs to tweak the diffing sensitivity for supported
   * diffing methods. Controls the various tolerance options all at once.
   */
  diffingMethodSensitivity?: `${DiffingMethodSensitivity}`;
  /**
   * One or more values to use as an override when locating the baseline for this snapshot. Omit a
   * key to leave it alone; set a key to `null` to explicitly clear it. Used, among other things, to
   * compare a snapshot against a baseline imported from Figma.
   */
  baselineOverride?: VisualBaselineOverride;
  /**
   * Specify what kind of checks needs to be done in a specific region
   */
  regions?: VisualRegion[];
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
