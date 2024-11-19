import type { TestContext } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import type { Page } from 'playwright-core';
import { internals } from '@saucelabs/visual-playwright';
import { SauceVisualParams, StoryContext, StoryVariation } from './types';
import events from '@storybook/core/core-events';

import type EventEmitter from 'node:events';

const { VisualPlaywright } = internals;

const clientVersion = 'PKG_VERSION';

export const VisualStorybook = new VisualPlaywright(
  `visual-storybook/${clientVersion}`,
);

/**
 * Proxy Storybook information to take Playwright snapshots with the appropriate metadata. Internal.
 * @param context
 * @param params
 */
const takeScreenshot = async (
  context: StoryContext,
  params: Partial<SauceVisualParams> | undefined,
) => {
  const {
    clip: shouldClip = true,
    clipSelector = '#storybook-root',
    ...otherOptions
  } = params ?? {};
  await VisualStorybook.takePlaywrightScreenshot(
    page,
    {
      testName: undefined,
      suiteName: undefined,
      deviceName: deviceName || undefined,
      testId: context.id,
    },
    `${context.title}/${context.name}`,
    {
      clipSelector: shouldClip ? clipSelector : undefined,
      ...otherOptions,
    },
  );
};

/**
 * Augment story names when creating visual variations.
 * @param context
 * @param variation
 */
export const augmentStoryName = (
  context: StoryContext,
  variation: StoryVariation,
): StoryContext => {
  const { id, title } = context;
  let { name } = context;

  if (variation.name) {
    name = variation.name;
  }

  if (variation.prefix) {
    name = `${variation.prefix}${name}`;
  }

  if (variation.postfix) {
    name = `${name}${variation.postfix}`;
  }

  return {
    id,
    title,
    name,
  };
};

/**
 * Used in Storybook's test runner config file (test-runner.js/ts) for the `postVisit` hook. Takes
 * a snapshot of the current viewport and uploads it to Sauce Visual.
 */
export const postVisit = async (page: Page, context: TestContext) => {
  const storyContext = await getStoryContext(page, context);
  const sauceVisualParams = storyContext.parameters.sauceVisual as
    | Partial<SauceVisualParams>
    | undefined;
  const variations = sauceVisualParams?.variations;

  await takeScreenshot(storyContext, sauceVisualParams);

  if (variations) {
    const storyId = storyContext.id;
    const args = storyContext.initialArgs;

    for (const variation of variations) {
      await page.evaluate(
        ({ variation, events, storyId }) => {
          // @ts-expect-error Global managed by Storybook.
          const channel: EventEmitter = globalThis.__STORYBOOK_ADDONS_CHANNEL__;
          if (!channel) {
            throw new Error(
              'The test runner could not access the Storybook channel. Are you sure the Storybook is running correctly in that URL?',
            );
          }

          const { args } = variation;

          // Reset values to default
          channel.emit(events['RESET_STORY_ARGS'], { storyId });

          // Then update them with the requested values
          if (args) {
            channel.emit(events['UPDATE_STORY_ARGS'], {
              storyId,
              updatedArgs: {
                ...args,
              },
            });
          }
        },
        {
          variation,
          events,
          storyId,
          args,
        },
      );

      await takeScreenshot(
        augmentStoryName(storyContext, variation),
        sauceVisualParams,
      );
    }
  }
};

/**
 * Exported for backwards compatibility. Replaced by `postVisit` in `@storybook/test-runner` version 0.15.0 and up. Use
 * `postVisit` exported from this package instead.
 *
 * @deprecated Replaced by `postVisit` in `@storybook/test-runner` version 0.15.0 and up. Use
 * `postVisit` exported from this package instead.
 */
export const postRender = postVisit;
