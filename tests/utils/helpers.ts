import { Build, BuildStatus, VisualApi } from '@saucelabs/visual';
import { randomBytes } from 'crypto';

export const RE_VISUAL_BUILD_LINK =
  /https:\/\/app\.(([a-z0-9-]+)\.)?saucelabs\.(com|net)\/visual\/builds\/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/g;
export const RE_VISUAL_BUILD_ID =
  /([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/g;

export const randomId = randomBytes(8).toString('hex');

export const SAUCE_VISUAL_PROJECT = `E2E test project - ${randomId}`;
export const SAUCE_VISUAL_BRANCH = `E2E test branch - ${randomId}`;
export const SAUCE_VISUAL_DEFAULT_BRANCH = `E2E test default branch - ${randomId}`;
export const SAUCE_VISUAL_BUILD_NAME = `E2E test build name - ${randomId}`;

export const waitStatusForBuild = async function (
  api: VisualApi,
  buildId: string,
  status: BuildStatus[],
  options?: {
    refreshRate?: number;
    retries?: number;
    buildIdType?: 'customId' | 'buildId';
  }
): Promise<Partial<Build> | undefined> {
  const {
    refreshRate = 500,
    buildIdType = 'buildId',
    retries = 10,
  } = options ?? {};
  let currentTry = 0;
  do {
    currentTry++;
    const build =
      buildIdType === 'buildId'
        ? await api.build(buildId)
        : await api.buildByCustomId(buildId);
    if (build?.status && status.includes(build?.status)) {
      return build;
    }
    await wait(refreshRate);
  } while (currentTry < retries);
  throw new Error(
    `Expected status ${status} never received for build ${buildId}`
  );
};

async function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
