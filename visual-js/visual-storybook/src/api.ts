import type { TestContext } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import type { Page } from 'playwright-core';
import {
  BuildStatus,
  getApi as getVisualApi,
  RegionIn,
} from '@saucelabs/visual';
import { buildSnapshotMetadata, getDomScript, getOpts } from './utils';
import { backOff } from 'exponential-backoff';
import { SauceVisualParams } from './types';

const clientVersion = 'PKG_VERSION';

export const createVisualApi = () => {
  const { user, key, region } = getOpts();

  return getVisualApi(
    {
      user,
      key,
      region,
    },
    {
      userAgent: `visual-storybook/${clientVersion}`,
    },
  );
};

export const getApi = () => {
  let api = globalThis.visualApi;
  if (!api) {
    api = createVisualApi();
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

    if (build.unapprovedCount > 0) {
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
 * Used in Storybook's test runner config file (test-runner.js/ts) for the `postVisit` hook. Takes
 * a snapshot of the current viewport and uploads it to Sauce Visual.
 */
export const postVisit = async (page: Page, context: TestContext) => {
  const { buildId } = getOpts();

  if (!buildId) {
    return;
  }

  const storyContext = await getStoryContext(page, context);
  const sauceVisualParams = storyContext.parameters.sauceVisual as
    | Partial<SauceVisualParams>
    | undefined;
  const browser = page.context().browser();
  const {
    screenshotOptions = {},
    clip: shouldClip = true,
    clipSelector = '#storybook-root',
    delay,
    captureDom,
    ignoreRegions: userIgnoreRegions,
  } = sauceVisualParams ?? {};
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
      (async () => {
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
        ].filter((region) => 0 < region.width * region.height);
      })(),
    );
  }

  // Await all queued / concurrent promises before resuming
  await Promise.all(promises);

  const clip = shouldClip
    ? await page.evaluate(
        ({ clipSelector }) => {
          // Clip the screenshot to the dims of the storybook root to bypass additional whitespace that's
          // likely unnecessary.
          const storybookRoot = document.querySelector(clipSelector);
          if (!storybookRoot) {
            return undefined;
          }

          const clientDims = storybookRoot.getBoundingClientRect();
          const { x, y, height, width } = clientDims;

          // If any values are falsy (or zero), then do not clip as those are invalid options for
          // playwright
          if (!x || !y || !height || !width) {
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
    deviceName: deviceName || undefined,
    buildId,
    name: `${context.title}/${context.name}`,
    ignoreRegions,
  });

  await api.createSnapshot({
    ...meta,
    uploadUuid: uploadId,
  });
};

/**
 * Exported for backwards compatibility. Replaced by `postVisit` in `@storybook/test-runner` version 0.15.0 and up. Use
 * `postVisit` exported from this package instead.
 *
 * @deprecated Replaced by `postVisit` in `@storybook/test-runner` version 0.15.0 and up. Use
 * `postVisit` exported from this package instead.
 */
export const postRender = postVisit;
