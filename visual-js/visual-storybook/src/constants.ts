import { VisualOpts } from './types';

export const OPTS_ENV_KEY = 'SAUCE_VISUAL_STORYBOOK_OPTS';

export const DEFAULT_OPTS: VisualOpts = {
  branch: null,
  defaultBranch: null,
  buildId: null,
  externalBuildId: true,
  project: null,
  user: undefined,
  key: undefined,
  region: 'us-west-1',
  buildName: 'Storybook Build',
  customId: null,
};
