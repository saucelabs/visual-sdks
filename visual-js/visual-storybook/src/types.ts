import { SauceRegion } from '@saucelabs/visual';
import { SauceVisualParams as PlaywrightParams } from '@saucelabs/visual-playwright';

export interface VisualOpts extends PlaywrightParams {
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

export interface SauceVisualParams extends PlaywrightParams {
  /**
   * Whether we should clip the story reduce whitespaces in snapshots.
   */
  clip?: boolean;
}
