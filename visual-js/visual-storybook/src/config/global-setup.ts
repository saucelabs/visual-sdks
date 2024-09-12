import { globalSetup } from 'jest-playwright-preset';
import { Config } from '@jest/types';
import { VisualStorybook } from '../api';

module.exports = async function (globalConfig: Config.GlobalConfig) {
  await globalSetup(globalConfig);
  await VisualStorybook.setup();
};
