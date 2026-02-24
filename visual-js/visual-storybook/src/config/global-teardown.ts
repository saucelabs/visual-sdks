import globalTeardown from '@storybook/test-runner/dist/jest-playwright-entries/teardown.js';
import { Config } from '@jest/types';
import { VisualStorybook } from '../api';

export default async function (globalConfig: Config.GlobalConfig) {
  await globalTeardown(globalConfig);
  await VisualStorybook.teardown();
}
