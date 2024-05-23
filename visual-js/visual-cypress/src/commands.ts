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
  SauceVisualViewport,
  ScreenshotMetadata,
  VisualCheckOptions,
  VisualRegion,
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

export function intoElement<R extends Omit<object, 'unknown>'>>(
  region: VisualRegion<R>,
): R {
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

// TODO: rename to: toChainableRegion
export function resolveChainables(
  item: PlainRegion | Cypress.Chainable<HTMLElement[]>,
): Cypress.Chainable<PlainRegion[]> {
  if (isChainable(item)) {
    return item.then(($el: HTMLElement[]): PlainRegion[] => {
      return $el.map(getElementDimensions);
    });
  } else if (isRegion(item)) {
    return cy.wrap([item]);
  } else {
    return cy.wrap<PlainRegion[]>([]);
  }
}

function chainableWaitForAll<S>(
  list: Cypress.Chainable<S>[],
): Cypress.Chainable<S[]> {
  return list.reduce((prev, cur) => {
    return prev.then((array) =>
      cur.then((resolvedCur) => [...array, resolvedCur]),
    );
  }, cy.wrap<S[]>([]));
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
    visualRegions.map(intoElement).map(resolveChainables),
  );

  const regionsPromise: Cypress.Chainable<ResolvedVisualRegion[]> =
    resolved.then((regions) => {
      let hasError = false;
      const result: ResolvedVisualRegion[] = [];
      try {
        for (const idx in regions) {
          if (regions[idx].length === 0) {
            visualLog(`sauce-visual: ignoreRegion[${idx}] does not exists or is empty`);
            hasError = true;
          }

          const applyScalingRatio = !isRegion(visualRegions[idx].element);

          for (const plainRegion of regions[idx]) {
            result.push({
              ...visualRegions[idx],
              element: plainRegion,
              applyScalingRatio,
            } satisfies ResolvedVisualRegion);
          }
        }
      } catch (e: unknown) {
        visualLog(`sauce-visual: ${e}`);
      }
      if (hasError) throw new Error('Some region are invalid. Please check the log for details.')
      return result;
    });

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

      regionsPromise.then((regions) => {
        cy.task('visual-register-screenshot', {
          id: `sauce-visual-${id}`,
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
