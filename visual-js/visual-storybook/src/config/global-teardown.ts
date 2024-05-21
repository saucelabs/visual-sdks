import { finishBuild, waitForBuildResult } from '../api';
import { globalTeardown } from 'jest-playwright-preset';
import { Config } from '@jest/types';
import { getOpts, removeDomScriptFile } from '../utils';

module.exports = async function (globalConfig: Config.GlobalConfig) {
  await globalTeardown(globalConfig);
  await removeDomScriptFile();

  const { buildId, externalBuildId } = getOpts();
  // Only finish the build automatically if we created it during globalSetup (if it's not external).
  if (!externalBuildId && buildId) {
    const finishedBuild = await finishBuild(buildId);

    if (!finishedBuild) {
      throw new Error('Failed to finalize build.');
    }

    await waitForBuildResult(finishedBuild.id);
  }
};
