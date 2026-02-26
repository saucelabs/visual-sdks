import globalSetup from '@storybook/test-runner/dist/jest-playwright-entries/setup.js';
import { Config } from '@jest/types';
import { VisualStorybook } from '../api';

export default async function (globalConfig: Config.GlobalConfig) {
  await globalSetup(globalConfig);
  await VisualStorybook.setup();
}
