import type { SauceRegion } from '@saucelabs/visual';
import type { SauceVisualParams as PlaywrightParams } from '@saucelabs/visual-playwright';

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

export interface ArgsTypes {
  [key: string]: any;
}

export interface StoryVariation<Args = ArgsTypes> {
  /**
   * A string to prepend prior to the story name when taking a snapshot.
   */
  prefix?: string;
  /**
   * A string to append after the story name when taking a snapshot.
   */
  postfix?: string;
  /**
   * One or more Args to overwrite in your Storybook stories. Will take a screenshot for each
   * requested variation and upload it to Sauce Labs.
   */
  args?: Args;
  /**
   * A name to optionally use instead of the default story name.
   */
  name?: string;
}

export interface SauceVisualParams<Args = ArgsTypes> extends PlaywrightParams {
  /**
   * Whether we should clip the story reduce whitespaces in snapshots.
   */
  clip?: boolean;
  /**
   * Variations of the current story we should take in addition to the default state.
   */
  variations?: StoryVariation<Args>[];
}

export interface StoryContext {
  id: string;
  title: string;
  name: string;
}
