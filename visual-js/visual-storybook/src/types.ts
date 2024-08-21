import { DiffingMethod, RegionIn, SauceRegion } from '@saucelabs/visual';
import { PageScreenshotOptions } from 'playwright-core';

export interface SauceVisualParams {
  screenshotOptions?: Pick<PageScreenshotOptions, 'animations' | 'caret'>;
  /**
   * Whether we should capture a dom snapshot.
   */
  captureDom?: boolean;
  /**
   * Whether we should clip the story reduce whitespaces in snapshots.
   */
  clip?: boolean;
  /**
   * A custom selector to clip to. Defaults to Storybook's default root element, `#storybook-root`.
   */
  clipSelector?: string;
  /**
   * A number, in ms, that we should delay the snapshot by. Useful if the beginning of the story
   * has unavoidable / javascript animations.
   */
  delay?: number;
  /**
   * One or more regions on the page to ignore. Used to block dynamic or ever-changing content you
   * don't want to diff.
   */
  ignoreRegions?: (RegionIn | string)[];
}

export interface VisualOpts {
  user: string | undefined;
  key: string | undefined;
  region: SauceRegion | undefined;
  /**
   * The build ID for the current run.
   */
  buildId: string | null;
  /**
   * Whether this build was created externally and provided via an ENV (sharding, concurrency).
   */
  externalBuildId: boolean;
  buildName: string;
  project: string | null;
  branch: string | null;
  defaultBranch: string | null;
  customId: string | null;
}
