import { BuildStatus, SauceRegion, getApi } from '@saucelabs/visual';
import { RE_VISUAL_BUILD_ID, SAUCE_VISUAL_BUILD_NAME } from './utils/helpers';
import { execute } from './utils/process';
import { FileHandle } from 'fs/promises';

const region = 'us-west-1' as SauceRegion;

const visualApi = getApi({
  region,
  user: process.env.SAUCE_USERNAME!,
  key: process.env.SAUCE_ACCESS_KEY!,
});

let fileOutput: FileHandle | undefined;
let dockerOutput = '';
let buildId = '';

describe('Build ID env var', () => {
  beforeAll(
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
      buildId = buildIds[0][1];
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
            SAUCE_VISUAL_BUILD_ID: buildId,
          },
        }
      );

      // Storybook container exits with code 1, this is expected behaviour
      if (!process.env.CONTAINER_IMAGE_NAME?.includes('storybook')) {
        expect(result.statusCode).toEqual(0);
      }
      dockerOutput = result.stdout;
    },
    2 * 60 * 1000
  );

  it(
    'screenshots are linked to the external build',
    async () => {
      const build = await visualApi.buildWithDiffs(buildId);
      expect(build).toBeTruthy();
      expect(build?.id).toEqual(buildId);
      expect(build?.name).toEqual(SAUCE_VISUAL_BUILD_NAME);
      expect(build?.diffs?.nodes.length).toBe(1);
      expect(build?.status).toBe(BuildStatus.Running);
    },
    15 * 1000
  );

  afterAll(
    async () => {
      const result = await execute(
        `npx @saucelabs/visual build finish --build-id "${buildId}"`,
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
