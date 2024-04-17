import { BuildStatus, SauceRegion, getApi } from '@saucelabs/visual';
import {
  RE_VISUAL_BUILD_ID,
  RE_VISUAL_BUILD_LINK,
  SAUCE_VISUAL_BRANCH,
  SAUCE_VISUAL_BUILD_NAME,
  SAUCE_VISUAL_DEFAULT_BRANCH,
  SAUCE_VISUAL_PROJECT,
  waitStatusForBuild,
} from './utils/helpers';
import { execute } from './utils/process';
import { FileHandle } from 'fs/promises';
import { randomBytes } from 'crypto';

const region = 'us-west-1' as SauceRegion;

const visualApi = getApi({
  region,
  user: process.env.SAUCE_USERNAME!,
  key: process.env.SAUCE_ACCESS_KEY!,
});

const customId = randomBytes(20).toString('hex');

let fileOutput: FileHandle | undefined;
let dockerOutput = '';
let buildId = '';
let externalBuildId = '';

describe('Env var tests', () => {
  it(
    'creates an external build',
    async () => {
      const result = await execute(
        `npx @saucelabs/visual build create -n "${SAUCE_VISUAL_BUILD_NAME}"`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
        }
      );
      expect(result.statusCode).toEqual(0);
      const cliOutput = result.stdout;
      const buildIds = [...cliOutput.matchAll(RE_VISUAL_BUILD_ID)];
      expect(buildIds.length).toBe(1);
      externalBuildId = buildIds[0][1];
    },
    2 * 60 * 1000
  );

  it(
    'runs the docker image with SAUCE_VISUAL_BUILD_ID in place',
    async () => {
      const result = await execute(
        `docker run --rm -e SAUCE_USERNAME -e SAUCE_ACCESS_KEY \\
        -e SAUCE_VISUAL_BUILD_ID \\
        ${process.env.CONTAINER_IMAGE_NAME}`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
          env: {
            SAUCE_VISUAL_BUILD_ID: externalBuildId,
          },
        }
      );

      expect(result.statusCode).toEqual(0);
      dockerOutput = result.stdout;
    },
    2 * 60 * 1000
  );

  it(
    'screenshots are linked to the external build',
    async () => {
      const build = await visualApi.buildWithDiffs(externalBuildId);
      expect(build).toBeTruthy();
      expect(build?.id).toEqual(externalBuildId);
      expect(build?.name).toEqual(SAUCE_VISUAL_BUILD_NAME);
      expect(build?.diffs?.nodes.length).toBe(1);
    },
    15 * 1000
  );

  it(
    'creates an external build with customId',
    async () => {
      const result = await execute(
        `npx @saucelabs/visual build create -n "${SAUCE_VISUAL_BUILD_NAME}" -c ${customId}`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
        }
      );
      expect(result.statusCode).toEqual(0);
      const cliOutput = result.stdout;
      const buildIds = [...cliOutput.matchAll(RE_VISUAL_BUILD_ID)];
      expect(buildIds.length).toBe(1);
      externalBuildId = buildIds[0][1];
    },
    2 * 60 * 1000
  );

  it(
    'runs the docker image with SAUCE_VISUAL_CUSTOM_ID in place',
    async () => {
      const result = await execute(
        `docker run --rm -e SAUCE_USERNAME -e SAUCE_ACCESS_KEY \\
        -e SAUCE_VISUAL_CUSTOM_ID \\
        ${process.env.CONTAINER_IMAGE_NAME}`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
          env: {
            SAUCE_VISUAL_CUSTOM_ID: customId,
          },
        }
      );

      expect(result.statusCode).toEqual(0);
      dockerOutput = result.stdout;
    },
    2 * 60 * 1000
  );

  it(
    'screenshots are linked to the external build with customId',
    async () => {
      const build = await visualApi.buildWithDiffsByCustomId(customId);
      expect(build).toBeTruthy();
      expect(build?.id).toEqual(externalBuildId);
      expect(build?.name).toEqual(SAUCE_VISUAL_BUILD_NAME);
      expect(build?.diffs?.nodes.length).toBe(1);
    },
    15 * 1000
  );

  it(
    'runs the docker image with env vars in place',
    async () => {
      const result = await execute(
        `docker run --rm -e SAUCE_USERNAME -e SAUCE_ACCESS_KEY \\
        -e SAUCE_VISUAL_PROJECT \\
        -e SAUCE_VISUAL_BRANCH \\
        -e SAUCE_VISUAL_DEFAULT_BRANCH \\
        -e SAUCE_VISUAL_BUILD_NAME \\
        ${process.env.CONTAINER_IMAGE_NAME}`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
          env: {
            SAUCE_VISUAL_PROJECT: SAUCE_VISUAL_PROJECT,
            SAUCE_VISUAL_BRANCH: SAUCE_VISUAL_BRANCH,
            SAUCE_VISUAL_DEFAULT_BRANCH: SAUCE_VISUAL_DEFAULT_BRANCH,
            SAUCE_VISUAL_BUILD_NAME: SAUCE_VISUAL_BUILD_NAME,
          },
        }
      );

      expect(result.statusCode).toEqual(0);
      dockerOutput = result.stdout;
    },
    2 * 60 * 1000
  );

  it('returns a valid build link', async () => {
    expect(dockerOutput.length).toBeGreaterThan(0);

    const links = [...dockerOutput.matchAll(RE_VISUAL_BUILD_LINK)];
    expect(links.length).toBe(1);
    buildId = links[0][4];
  });

  it(
    'env vars are processed correctly',
    async () => {
      expect(buildId).toMatch(RE_VISUAL_BUILD_ID);

      await waitStatusForBuild(visualApi, buildId, [BuildStatus.Unapproved], {
        refreshRate: 1000,
        retries: 10,
      });

      const build = await visualApi.build(buildId);
      expect(build).toBeTruthy();
      expect(build?.id).toEqual(buildId);
      expect(build?.name).toEqual(SAUCE_VISUAL_BUILD_NAME);
      expect(build?.project).toBe(SAUCE_VISUAL_PROJECT);
      expect(build?.branch).toBe(SAUCE_VISUAL_BRANCH);
      expect(build?.defaultBranch).toBe(SAUCE_VISUAL_DEFAULT_BRANCH);
    },
    15 * 1000
  );
});
