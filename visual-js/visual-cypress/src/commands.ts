/**
 * The content of this file will be evaluated by Cypress Browser.
 * It has access to browser, viewport, etc... but has no access to
 * installed dependencies (like Visual API client).
 *
 * It communicates with Cypress main process through *cy.task()* actions.
 */

/* eslint-disable @typescript-eslint/no-namespace */
import {
  PlainRegion,
  ResolvedVisualRegion,
  SauceConfig,
  SauceVisualViewport,
  ScreenshotMetadata,
  VisualCheckOptions,
  VisualRegion,
} from './types';
import type { DiffStatus } from '@saucelabs/visual';

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

      sauceVisualResults(): Chainable<Record<DiffStatus, number>>;
    }
    interface EndToEndConfigOptions {
      saucelabs: SauceConfig;
    }
  }
}

const visualLog = (msg: string, level: 'info' | 'warn' | 'error' = 'error') =>
  cy.task('visual-log', { level, msg });

export function isRegion<T extends object>(elem: T): elem is PlainRegion & T {
  if ('x' in elem && 'y' in elem && 'width' in elem && 'height' in elem) {
    return true;
  }
  return false;
}

/* If contains a chainerId, assume this is a Cypress.Chainable. */
export function isChainable(elem: any): elem is Cypress.Chainable {
  return 'chainerId' in elem;
}

export function intoElement<R extends object>(region: VisualRegion<R>): R {
  return 'element' in region ? region.element : region;
}

export function getElementDimensions(elem: HTMLElement): PlainRegion {
  const rect = elem.getBoundingClientRect();
  return {
    x: Math.floor(rect.left),
    y: Math.floor(rect.top),
    width: Math.floor(rect.width),
    height: Math.floor(rect.height),
  };
}

export function toChainableRegion(
  item: PlainRegion | Cypress.Chainable<HTMLElement[]>,
): Cypress.Chainable<PlainRegion[]> {
  if (isChainable(item)) {
    return item.then(($el: ArrayLike<HTMLElement>): PlainRegion[] => {
      // $el is not a real array an `.map(..)` doesn't work on it properly
      const result: PlainRegion[] = [];
      for (let i = 0; i < $el.length; i++)
        result.push(getElementDimensions($el[i]));
      return result;
    });
  } else if (isRegion(item)) {
    return cy.wrap([item]);
  } else {
    return cy.wrap<PlainRegion[]>([]);
  }
}

// Emulates `Promise.all` with Cypress.Chainables
// Note: It is not allowed to nest `.then` calls.
// There needs to be a linear line of `.then` calls.
function chainableWaitForAll<S>(
  list: Cypress.Chainable<S>[],
): Cypress.Chainable<S[]> {
  const result: S[] = [];

  list.forEach((item) => {
    item.then((el) => {
      result.push(el);
    });
  });

  return cy.wrap(result);
}

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
  const visualRegions: VisualRegion[] = [
    ...(options?.ignoredRegions ?? []).map((r) => ({
      enableOnly: [],
      element: r,
    })),
    ...(options?.regions ?? []),
  ];

  const resolved = chainableWaitForAll(
    visualRegions.map(intoElement).map(toChainableRegion),
  );

  const regionsPromise: Cypress.Chainable<ResolvedVisualRegion[]> =
    resolved.then((regions) => {
      let hasError = false;
      const result: ResolvedVisualRegion[] = [];
      for (const idx in regions) {
        if (regions[idx].length === 0) {
          visualLog(
            `sauce-visual: ignoreRegion[${idx}] does not exists or is empty`,
          );
          hasError = true;
        }

        for (const plainRegion of regions[idx]) {
          result.push({
            ...visualRegions[idx],
            element: plainRegion,
          } satisfies ResolvedVisualRegion);
        }
      }

      if (hasError)
        throw new Error(
          'Some region are invalid. Please check the log for details.',
        );
      return result;
    });

  const screenshotId = `sauce-visual-${randomId()}`;
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

      return regionsPromise.then((regions) => {
        cy.task('visual-register-screenshot', {
          id: screenshotId,
          name: screenshotName,
          suiteName: Cypress.currentTest.titlePath.slice(0, -1).join(' '),
          testName: Cypress.currentTest.title,
          regions,
          diffingMethod: options?.diffingMethod,
          diffingOptions: options?.diffingOptions,
          devicePixelRatio: win.devicePixelRatio,
          viewport: realViewport,
          dom: getDom() ?? undefined,
        } satisfies ScreenshotMetadata);
      });
    });
  });

  cy.get<Cypress.Dimensions | undefined>('@clipToBounds').then(
    (clipToBounds) => {
      cy.screenshot(screenshotId, {
        clip: clipToBounds,
        ...options?.cypress,
      });
    },
  );
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
