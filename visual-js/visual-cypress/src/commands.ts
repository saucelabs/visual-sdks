/**
 * The content of this file will be evaluated by Cypress Browser.
 * It has access to browser, viewport, etc... but has no access to
 * installed dependencies (like Visual API client).
 *
 * It communicates with Cypress main process through *cy.task()* actions.
 */

/* eslint-disable @typescript-eslint/no-namespace */
import {
  SauceVisualViewport,
  ScreenshotMetadata,
  VisualCheckOptions,
  VisualRegion,
  VisualRegionWithRatio,
} from './types';

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      sauceVisualCheck(
        screenshotName: string,
        options?: VisualCheckOptions,
      ): Chainable<Subject>;

      /**
       * @deprecated Use `sauceVisualCheck` command. `visualCheck` will be removed in future version.
       */
      visualCheck(
        screenshotName: string,
        options?: VisualCheckOptions,
      ): Chainable<Subject>;

      sauceVisualResults(): Chainable<Subject>;
    }
  }
}

const visualLog = (msg: string, level: 'info' | 'warn' | 'error' = 'error') =>
  cy.task('visual-log', { level, msg });

export function isRegion(elem: any): elem is VisualRegion {
  if ('x' in elem && 'y' in elem && 'width' in elem && 'height' in elem) {
    return true;
  }
  return false;
}

/* If contains a chainerId, assume this is a Cypress.Chainable. */
export function isChainable(elem: any): elem is Cypress.Chainable {
  return 'chainerId' in elem;
}

/**
 * Note: Even if looks like promises, it is not. Cypress makes it run in a consistent and deterministic way.
 * As a result, item.then() will be resolved before the cy.screenshot() and cy.task() is executed.
 * That makes us be sure that ignoredRegion is populated correctly before the metadata being sent back to
 * Cypress main process.
 *
 * https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#You-cannot-race-or-run-multiple-commands-at-the-same-time
 */
const sauceVisualCheckCommand = (
  screenshotName: string,
  options?: VisualCheckOptions,
) => {
  const { clipSelector } = options ?? {};
  const randomId = () => Cypress._.random(0, 1e9);

  cy.task('visual-log-capture', { screenshotName });

  /**
   * Getting real viewport
   *
   * Since the assignation of the viewport is done in a closure, the object needs to be existing.
   * Otherwise, it will modify the value instead of the attribute of the referenced object.
   */
  const viewport: SauceVisualViewport = {
    width: 0,
    height: 0,
  };
  cy.window({ log: false }).then((win) => {
    viewport.width = win.innerWidth;
    viewport.height = win.innerHeight;
  });

  const getElementDimensions = (elem: HTMLElement) => {
    const rect = elem.getBoundingClientRect();
    return {
      x: Math.floor(rect.left),
      y: Math.floor(rect.top),
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
    } satisfies Cypress.Dimensions;
  };

  if (clipSelector) {
    cy.get(clipSelector).then((elem) => {
      const firstMatch = elem.get().find((item) => item);

      if (firstMatch) {
        cy.wrap(getElementDimensions(firstMatch)).as('clipToBounds');
      }
    });
  } else {
    cy.wrap(undefined).as('clipToBounds');
  }

  /* Remap ignore area */
  const providedIgnoredRegions = options?.ignoredRegions ?? [];
  const ignoredRegions: VisualRegionWithRatio[] = [];
  for (const idx in providedIgnoredRegions) {
    const item = providedIgnoredRegions[idx];
    if (isRegion(item)) {
      ignoredRegions.push({
        applyScalingRatio: false,
        ...item,
      });
      continue;
    }

    if (isChainable(item)) {
      item.then(($el: HTMLElement[]) => {
        for (const elem of $el) {
          const rect = getElementDimensions(elem);
          ignoredRegions.push({
            applyScalingRatio: true,
            ...rect,
          });
        }
      });
      continue;
    }

    throw new Error(`ignoreRegion[${idx}] has an unknown type`);
  }

  const id = randomId();
  cy.get<Cypress.Dimensions | undefined>('@clipToBounds').then(
    (clipToBounds) => {
      cy.screenshot(`sauce-visual-${id}`, {
        clip: clipToBounds,
        ...options?.cypress,
      });
    },
  );

  cy.window({ log: false }).then((win) => {
    cy.task<string | undefined>('get-script', { log: false }).then((script) => {
      // See note around "viewport" declaration.
      const realViewport =
        viewport.height && viewport.width ? viewport : undefined;

      const getDom = () => {
        if (!options?.captureDom) return null;
        try {
          if (!script) throw new Error(`Cannot get dom capturing script.`);

          const dom = win.eval(
            `(function({ clipSelector }){${script}})({ clipSelector: '${clipSelector}' })`,
          ) as unknown;
          if (typeof dom !== 'string')
            throw new Error(`Dom type should be a string not a ${typeof dom}.`);
          return dom;
        } catch (err: unknown) {
          visualLog(`sauce-visual: Failed to capture dom:\n${err}`);
          return null;
        }
      };

      cy.task('visual-register-screenshot', {
        id: `sauce-visual-${id}`,
        name: screenshotName,
        suiteName: Cypress.currentTest.titlePath.slice(0, -1).join(' '),
        testName: Cypress.currentTest.title,
        ignoredRegions,
        diffingMethod: options?.diffingMethod,
        devicePixelRatio: win.devicePixelRatio,
        viewport: realViewport,
        dom: getDom() ?? undefined,
      } satisfies ScreenshotMetadata);
    });
  });
};

Cypress.Commands.add(
  'visualCheck',
  (screenshotName: string, options?: VisualCheckOptions) => {
    visualLog(
      `sauce-visual: Command "visualCheck" is deprecated and will be removed in a future version. Please use "sauceVisualCheck".`,
      'warn',
    );
    return sauceVisualCheckCommand(screenshotName, options);
  },
);
Cypress.Commands.add('sauceVisualCheck', sauceVisualCheckCommand);
Cypress.Commands.add('sauceVisualResults', () => {
  return cy.task('visual-test-results');
});
