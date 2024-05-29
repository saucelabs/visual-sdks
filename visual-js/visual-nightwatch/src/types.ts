import {
  DiffingMethod,
  FullPageScreenshotOptions,
  getApi,
  RegionIn,
} from '@saucelabs/visual';
import { NightwatchTestSettingGeneric } from 'nightwatch/types/nightwatch-options';

export type Ignorable = string | RegionIn;

export type SauceVisualAPI = ReturnType<typeof getApi>

export interface CheckOptions {
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
}

export interface SauceVisualServiceOptions extends Pick<CheckOptions, 'fullPage' | 'captureDom' | 'clipSelector'>{
    buildName?: string;
    project?: string;
    branch?: string;
    defaultBranch?: string;
    failOnFailures?: boolean;
}

export type RunnerSettings = NightwatchTestSettingGeneric & {
    sauceVisualService: SauceVisualServiceOptions;
};
