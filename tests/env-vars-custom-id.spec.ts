import { BuildMode, BuildStatus, SauceRegion, getApi } from '@saucelabs/visual';
import {
  RE_VISUAL_BUILD_ID,
  RE_VISUAL_BUILD_LINK,
  SAUCE_VISUAL_BUILD_NAME,
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
const customId2 = randomBytes(20).toString('hex');

let fileOutput: FileHandle | undefined;
let dockerOutput = '';
let externalBuildId = '';
let buildId = '';

describe('Custom ID env var', () => {
  beforeAll(
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
      expect(buildIds.length).toBeGreaterThanOrEqual(1);
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
      expect(build?.status).toBe(BuildStatus.Running);
    },
    15 * 1000
  );

  it(
    'runs the docker image with an unlinked custom ID in place',
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
            SAUCE_VISUAL_CUSTOM_ID: customId2,
          },
        }
      );

      expect(result.statusCode).toEqual(0);
      dockerOutput = result.stdout;
    },
    2 * 60 * 1000
  );

  it('returns a new build ID (not external build ID)', async () => {
    expect(dockerOutput.length).toBeGreaterThan(0);

    const links = [...dockerOutput.matchAll(RE_VISUAL_BUILD_LINK)];
    expect(links.length).toBeGreaterThanOrEqual(1);
    buildId = links[0][4];
    expect(buildId).not.toEqual(externalBuildId);
  });

  it(
    'build is completed',
    async () => {
      expect(buildId).toMatch(RE_VISUAL_BUILD_ID);

      await waitStatusForBuild(visualApi, buildId, [BuildStatus.Unapproved], {
        refreshRate: 1000,
        retries: 10,
      });

      const build = await visualApi.buildWithDiffs(buildId);
      expect(build).toBeTruthy();
      expect(build?.diffs?.nodes.length).toBe(1);
    },
    15 * 1000
  );

  afterAll(
    async () => {
      const result = await execute(
        `npx @saucelabs/visual build finish -c "${customId}"`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
        }
      );
      expect(result.statusCode).toEqual(0);
    },
    2 * 60 * 1000
  );
});
