import type { DiffingMethod, FullPageScreenshotOptions, RegionIn } from '@saucelabs/visual';
import type { Elements, EnhancedElementInstance, ScopedElement } from 'nightwatch';

export type Ignorable = string | string[] | RegionIn | ScopedElement | EnhancedElementInstance<any> | Elements;

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
