import { BuildStatus, SauceRegion, getApi } from '@saucelabs/visual';
import {
  RE_VISUAL_BUILD_ID,
  RE_VISUAL_BUILD_LINK,
  SAUCE_VISUAL_BUILD_NAME,
  waitStatusForBuild,
} from './utils/helpers';
import { execute } from './utils/process';
import { FileHandle } from 'fs/promises';
import { randomBytes } from 'crypto';

const region = (process.env.SAUCE_REGION ?? 'us-west-1') as SauceRegion;

const visualApi = getApi({
  region,
  user: process.env.SAUCE_USERNAME!,
  key: process.env.SAUCE_ACCESS_KEY!,
});

const customId = randomBytes(20).toString('hex');

let fileOutput: FileHandle | undefined;
let dockerOutput = '';
let buildId = '';

describe('Unlinked custom ID env var', () => {
  it(
    'runs the docker image with an unlinked custom ID in place',
    async () => {
      const result = await execute(
        `docker run --rm -e SAUCE_USERNAME -e SAUCE_ACCESS_KEY \\
        -e SAUCE_VISUAL_BUILD_NAME \\
        -e SAUCE_VISUAL_CUSTOM_ID \\
        -e SAUCE_REGION \\
        -e RUN_IT_SINGLE \\
        ${process.env.CONTAINER_IMAGE_NAME}`,
        {
          displayOutputOnFailure: true,
          pipeOutput: false,
          fileOutput,
          env: {
            SAUCE_VISUAL_BUILD_NAME: SAUCE_VISUAL_BUILD_NAME,
            SAUCE_VISUAL_CUSTOM_ID: customId,
            SAUCE_REGION: region,
            RUN_IT_SINGLE: 'true'
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

  it('returns a new build ID', async () => {
    expect(dockerOutput.length).toBeGreaterThan(0);

    const links = [...dockerOutput.matchAll(RE_VISUAL_BUILD_LINK)];
    expect(links.length).toBeGreaterThanOrEqual(1);
    buildId = links[0][4];
    expect(buildId).toMatch(RE_VISUAL_BUILD_ID);
  });

  it(
    'build is completed',
    async () => {
      expect(buildId).toMatch(RE_VISUAL_BUILD_ID);

      await waitStatusForBuild(visualApi, buildId, [BuildStatus.Unapproved], {
        refreshRate: 1000,
        retries: 30,
      });

      const build = await visualApi.buildWithDiffs(buildId);
      expect(build).toBeTruthy();
      expect(build?.diffs?.nodes.length).toBeGreaterThanOrEqual(1);
    },
    60 * 1000
  );
});
