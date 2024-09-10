import type { Page } from 'playwright-core';
import {
  BuildStatus,
  getApi as getVisualApi,
  getDomScript,
  RegionIn,
} from '@saucelabs/visual';
import { backOff } from 'exponential-backoff';
import { SauceVisualParams } from './types';
import { buildSnapshotMetadata, getOpts } from './utils';
import { TestInfo } from '@playwright/test';

const clientVersion = 'PKG_VERSION';

export const createVisualApi = (client: string) => {
  const { user, key, region } = getOpts();

  return getVisualApi(
    {
      user,
      key,
      region,
    },
    {
      userAgent: client,
    },
  );
};

export const getApi = (client = `visual-playwright/${clientVersion}`) => {
  let api = globalThis.visualApi;
  if (!api) {
    api = createVisualApi(client);
    globalThis.visualApi = api;
  }
  return api;
};

export const getBuildIdForCustomId = async (
  customId: string,
): Promise<string | null> => {
  const build = await getApi().buildByCustomId(customId);
  return build?.id ?? null;
};

export const createBuild = async () => {
  const { buildName, project, branch, customId, defaultBranch } = getOpts();
  const build = await getApi().createBuild({
    name: buildName,
    branch,
    defaultBranch,
    project,
    customId,
  });

  if (!build) {
    throw new Error(
      "Failed to create Sauce Visual build. Please check that you've supplied valid credentials and selected an available region for your account and try again.",
    );
  }

  console.info(
    `View your in-progress build on the Sauce Labs dashboard: 
  ${build.url}
`,
  );

  return build.id;
};

export const finishBuild = async (id: string) => {
  return await getApi().finishBuild({
    uuid: id,
  });
};

/**
 * Wait for the result of the build. Retries gracefully until a build status !== running is met.
 * Resolves with an exit code of 1 if unreviewed changes are found.
 * @param buildId
 */
export const waitForBuildResult = async (buildId: string) => {
  const buildInProgressError = new Error('Build execution in progress.');
  const buildNotFoundError = new Error(
    'Build has been deleted or you do not have access to view it.',
  );

  try {
    const fetchBuild = async () => {
      const build = await getApi().buildStatus(buildId);

      if (!build) {
        throw buildNotFoundError;
      }

      if (build.status !== BuildStatus.Running) {
        return build;
      }

      throw buildInProgressError;
    };

    const build = await backOff(fetchBuild, {
      maxDelay: 10000,
      numOfAttempts: 20,
      // continues to retry on true, on false will short-circuit and end retry early
      retry: (e) => e !== buildNotFoundError,
    });

    console.info(
      `Your Sauce Visual Build is ready for review:
  ${build.url}
`,
    );

    if (build.unapprovedCount > 0 || build.errorCount > 0) {
      process.exitCode = 1;
    }
  } catch (e) {
    console.error(
      `Failed to determine build completion status. This could be due to an abnormally long-running build, or an error in communication with the server. See the error message below for more details:
      
${e instanceof Error ? e.message : JSON.stringify(e)}
`,
    );

    process.exitCode = 1;
  }
};

/**
 * Takes a snapshot of the current viewport and uploads it to Sauce Visual.
 */
export const sauceVisualCheck = async (
  page: Page,
  testInfo: TestInfo,
  name: string,
  options?: Partial<SauceVisualParams>,
) =>
  await takePlaywrightScreenshot(
    page,
    {
      deviceName: testInfo.project.name,
      testName: testInfo.title,
      suiteName: testInfo.titlePath.slice(0, -1).join('/'),
    },
    name,
    options,
  );

export const takePlaywrightScreenshot = async (
  page: Page,
  info: {
    testName: string | undefined;
    suiteName: string | undefined;
    deviceName: string | undefined;
  },
  name: string,
  options?: Partial<SauceVisualParams>,
) => {
  const { testName, suiteName, deviceName } = info;
  const { buildId } = getOpts();

  if (!buildId) {
    console.warn('No Sauce Visual build present, skipping Visual snapshot.');
    return;
  }

  const browser = page.context().browser();
  const {
    screenshotOptions = {},
    clipSelector,
    delay,
    captureDom,
    ignoreRegions: userIgnoreRegions,
    diffingMethod,
  } = options ?? {};
  const { animations = 'disabled', caret } = screenshotOptions;
  let ignoreRegions: RegionIn[] = [];

  const promises: Promise<unknown>[] = [
    // Wait for all fonts to be loaded & ready
    page.evaluate(() => document.fonts.ready),
  ];

  if (delay) {
    // If a delay has been configured by the user, append it to our promises
    promises.push(new Promise((resolve) => setTimeout(resolve, delay)));
  }

  if (userIgnoreRegions) {
    promises.push(
      (async (): Promise<void> => {
        const filterIgnoreRegion = (
          region: RegionIn | string,
        ): region is RegionIn => typeof region !== 'string';
        const filterIgnoreSelector = (
          region: RegionIn | string,
        ): region is string => typeof region === 'string';

        const selectors = userIgnoreRegions.filter(filterIgnoreSelector);
        let selectorRegions: RegionIn[] = [];

        if (selectors.length) {
          selectorRegions = await page.evaluate(
            ({ selectors }) => {
              const selectorRegions: RegionIn[] = [];
              selectors.forEach((selector) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((element) => {
                  const rect = element.getBoundingClientRect();

                  selectorRegions.push({
                    name: selector,
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    height: Math.round(rect.height),
                    width: Math.round(rect.width),
                  });
                });
              });
              return selectorRegions;
            },
            { selectors },
          );
        }

        ignoreRegions = [
          ...userIgnoreRegions.filter(filterIgnoreRegion),
          ...selectorRegions,
        ].filter(
          (region) =>
            0 < Math.max(region.width, 0) * Math.max(region.height, 0),
        );
      })(),
    );
  }

  // Await all queued / concurrent promises before resuming
  await Promise.all(promises);

  const clip = clipSelector
    ? await page.evaluate(
        ({ clipSelector }) => {
          // Clip the screenshot to the dims of the requested clipSelector.
          const clipElement = document.querySelector(clipSelector);
          if (!clipElement) {
            return undefined;
          }

          const clientDims = clipElement.getBoundingClientRect();
          let { x, y, height, width } = clientDims;

          // corrected coordinates
          const cX = x < 0 ? Math.abs(x) : 0;
          const cY = y < 0 ? Math.abs(y) : 0;

          ({ x, y, width, height } = {
            x: Math.max(x, 0),
            y: Math.max(y, 0),
            width: cX > 0 ? width - cX : width,
            height: cY > 0 ? height - cY : height,
          });

          // If any values are < 0, then do not clip as those are invalid options for
          // playwright
          if (x < 0 || y < 0 || height <= 0 || width <= 0) {
            return undefined;
          }

          return {
            x,
            y,
            height,
            width,
          };
        },
        { clipSelector },
      )
    : undefined;

  const devicePixelRatio = await page.evaluate(() => window.devicePixelRatio);

  const screenshotBuffer = await page.screenshot({
    fullPage: true,
    animations,
    caret,
    clip,
  });

  // Inject scripts to get dom snapshot
  let dom: string | undefined;
  const script = await getDomScript();

  if (captureDom && script) {
    let error: string | undefined;
    try {
      const result = await page.evaluate<unknown>(
        `(function({ clipSelector }){${script}})({ clipSelector: '${clipSelector}' })`,
      );

      if (typeof result === 'string') {
        dom = result;
      } else {
        error = `Dom type should be string not ${typeof result}.`;
      }
    } catch (err: unknown) {
      error = `Unable to capture the dom.\n${err}`;
    }

    if (error) {
      console.error(error);
    }
  }

  const api = getApi();
  const uploadId = await api.uploadSnapshot({
    buildId,
    image: { data: screenshotBuffer },
    dom: dom ? { data: Buffer.from(dom) } : undefined,
  });

  const meta = buildSnapshotMetadata({
    browserVersion: browser?.version(),
    browserName: browser?.browserType().name(),
    devicePixelRatio,
    deviceName: deviceName,
    buildId,
    name,
    ignoreRegions,
    diffingMethod,
  });

  await api.createSnapshot({
    ...meta,
    testName,
    suiteName,
    uploadUuid: uploadId,
  });
};
