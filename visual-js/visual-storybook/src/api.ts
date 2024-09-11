import type { TestContext } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import type { Page } from 'playwright-core';
import { internals } from '@saucelabs/visual-playwright';
import { SauceVisualParams } from './types';

const { VisualPlaywright } = internals;

const clientVersion = 'PKG_VERSION';

export const VisualStorybook = new VisualPlaywright(
  `visual-storybook/${clientVersion}`,
);

/**
 * Used in Storybook's test runner config file (test-runner.js/ts) for the `postVisit` hook. Takes
 * a snapshot of the current viewport and uploads it to Sauce Visual.
 */
export const postVisit = async (page: Page, context: TestContext) => {
  const storyContext = await getStoryContext(page, context);
  const sauceVisualParams = storyContext.parameters.sauceVisual as
    | Partial<SauceVisualParams>
    | undefined;
  const {
    clip: shouldClip = true,
    clipSelector = '#storybook-root',
    ...otherOptions
  } = sauceVisualParams ?? {};

  await VisualStorybook.takePlaywrightScreenshot(
    page,
    {
      testName: undefined,
      suiteName: undefined,
      deviceName: deviceName || undefined,
    },
    `${context.title}/${context.name}`,
    {
      clipSelector: shouldClip ? clipSelector : undefined,
      ...otherOptions,
    },
  );
};

/**
 * Exported for backwards compatibility. Replaced by `postVisit` in `@storybook/test-runner` version 0.15.0 and up. Use
 * `postVisit` exported from this package instead.
 *
 * @deprecated Replaced by `postVisit` in `@storybook/test-runner` version 0.15.0 and up. Use
 * `postVisit` exported from this package instead.
 */
export const postRender = postVisit;
