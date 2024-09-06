import {
  downloadDomScript,
  getEnvOpts,
  removeDomScriptFile,
  VisualEnvOpts,
} from '@saucelabs/visual';
import {
  createBuild,
  finishBuild,
  getApi,
  getBuildIdForCustomId,
  waitForBuildResult,
} from './api';
import { getOpts, parseOpts, setOpts } from './utils';

export const sauceVisualSetup = async (opts?: VisualEnvOpts) => {
  parseOpts();

  if (opts) {
    setOpts(opts);
  }

  await downloadDomScript(getApi());

  const { buildId: passedBuildId, customId } = getEnvOpts();
  let buildId = passedBuildId;
  let customBuildId = null;

  if (!buildId && customId) {
    customBuildId = await getBuildIdForCustomId(customId);

    console.info(`USING CUSTOM ID ${customId} for build ${customBuildId}`);

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

export const sauceVisualTeardown = async () => {
  await removeDomScriptFile();

  const { buildId } = getOpts();
  const externalBuildId = false;
  // Only finish the build automatically if we created it during globalSetup (if it's not external).
  if (!externalBuildId && buildId) {
    const finishedBuild = await finishBuild(buildId);

    if (!finishedBuild) {
      throw new Error('Failed to finalize build.');
    }

    await waitForBuildResult(finishedBuild.id);
  }
};
