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

const region = (process.env.SAUCE_REGION ?? 'us-west-1') as SauceRegion;

const visualApi = getApi({
  region,
  user: process.env.SAUCE_USERNAME!,
  key: process.env.SAUCE_ACCESS_KEY!,
});

let fileOutput: FileHandle | undefined;
let dockerOutput = '';
let buildId = '';

describe('Build-configuring env vars', () => {
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

      // Storybook container exits with code 1, this is expected behaviour
      if (!process.env.CONTAINER_IMAGE_NAME?.includes('storybook')) {
        expect(result.statusCode).toEqual(0);
      }
      dockerOutput = result.stdout;
    },
    2 * 60 * 1000
  );

  it('returns a valid build link', async () => {
    expect(dockerOutput.length).toBeGreaterThan(0);

    const links = [...dockerOutput.matchAll(RE_VISUAL_BUILD_LINK)];
    expect(links.length).toBeGreaterThanOrEqual(1);
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
