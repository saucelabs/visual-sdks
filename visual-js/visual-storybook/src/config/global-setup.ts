import { createBuild, getBuildIdForCustomId } from '../api';
import { globalSetup } from 'jest-playwright-preset';
import { Config } from '@jest/types';
import { downloadDomScript, getOpts, setOpts } from '../utils';

module.exports = async function (globalConfig: Config.GlobalConfig) {
  await globalSetup(globalConfig);
  await downloadDomScript();

  const { buildId: passedBuildId, customId } = getOpts();
  let buildId = passedBuildId;
  let customBuildId = null;

  if (!buildId && customId) {
    customBuildId = await getBuildIdForCustomId(customId);

    if (customBuildId) {
      buildId = customBuildId;
      setOpts({
        buildId,
        externalBuildId: true,
      });
    }
  }

  if (!buildId) {
    const newBuildId = await createBuild();

    setOpts({
      buildId: newBuildId,
      externalBuildId: false,
    });
  }
};
