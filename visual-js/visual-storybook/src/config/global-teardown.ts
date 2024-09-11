import { globalTeardown } from 'jest-playwright-preset';
import { Config } from '@jest/types';
import { VisualStorybook } from '../api';

module.exports = async function (globalConfig: Config.GlobalConfig) {
  await globalTeardown(globalConfig);
  await VisualStorybook.teardown();
};
