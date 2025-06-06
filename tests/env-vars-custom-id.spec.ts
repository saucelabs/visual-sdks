import { BuildStatus, SauceRegion, getApi } from '@saucelabs/visual';
import {
  RE_VISUAL_BUILD_ID,
  SAUCE_VISUAL_BUILD_NAME,
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
let externalBuildId = '';

describe('Custom ID env var', () => {
  beforeAll(
    async () => {
      const result = await execute(
        `npx @saucelabs/visual build create -n "${SAUCE_VISUAL_BUILD_NAME}" -c ${customId}`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
          env: {
            SAUCE_REGION: region,
          },
        },
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
        -e SAUCE_VISUAL_BUILD_NAME \\
        -e SAUCE_VISUAL_CUSTOM_ID \\
        -e SAUCE_REGION \\
        ${process.env.CONTAINER_IMAGE_NAME}`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
          env: {
            SAUCE_VISUAL_BUILD_NAME: SAUCE_VISUAL_BUILD_NAME,
            SAUCE_VISUAL_CUSTOM_ID: customId,
            SAUCE_REGION: region,
          },
        }
      );
      // Storybook container exits with code 1, this is expected behaviour
      if (!process.env.CONTAINER_IMAGE_NAME?.includes('storybook')) {
        expect(result.statusCode).toEqual(0);
      }
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

  afterAll(
    async () => {
      const result = await execute(
        `npx @saucelabs/visual build finish -c "${customId}"`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
          env: {
            SAUCE_REGION: region,
          },
        }
      );
      expect(result.statusCode).toEqual(0);
    },
    2 * 60 * 1000
  );
});
