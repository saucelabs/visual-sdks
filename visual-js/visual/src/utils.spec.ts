import { describe, expect, test } from '@jest/globals';
import { getFullPageConfig, parseRegionsForAPI } from './utils';
import { RegionIn } from './graphql/__generated__/graphql';
import { FullPageScreenshotOptions } from './types';

type MockElement = { elementId: string };

const configDelay: FullPageScreenshotOptions<MockElement> = {
  delayAfterScrollMs: 1500,
};

const configDelayBig: FullPageScreenshotOptions<MockElement> = {
  delayAfterScrollMs: 5000,
};

/**
 * Simple resolver to test basic string & region parsing.
 * @param itemPromise
 */
const resolveForTest = async (itemPromise: string | Promise<RegionIn>) => {
  const item = await itemPromise;
  if (typeof item === 'object') return [item];
  return [{ id: item }];
};

describe('utils', () => {
  describe('getFullPageConfig', () => {
    describe('returns undefined', () => {
      test('when main is true and local is false', async () => {
        expect(await getFullPageConfig(true, false)).toBeUndefined();
      });
      test('when main is false and local is false', async () => {
        expect(await getFullPageConfig(false, false)).toBeUndefined();
      });
      test('when main is false and local is false', async () => {
        expect(await getFullPageConfig(false, false)).toBeUndefined();
      });
      test('when main is object and local is false', async () => {
        expect(await getFullPageConfig(configDelay, false)).toBeUndefined();
      });
      test('when main is undefined and local is false', async () => {
        expect(await getFullPageConfig(undefined, false)).toBeUndefined();
      });
      test('when main is undefined and local is undefined', async () => {
        expect(await getFullPageConfig(undefined, undefined)).toBeUndefined();
      });
      test('when main is false and local is undefined', async () => {
        expect(await getFullPageConfig(false, undefined)).toBeUndefined();
      });
    });
    describe('returns empty config', () => {
      test('when main is true and local is true', async () => {
        expect(await getFullPageConfig(true, undefined)).toEqual({});
      });
      test('when main is false and local is true', async () => {
        expect(await getFullPageConfig(true, undefined)).toEqual({});
      });
      test('when main is undefined and local is true', async () => {
        expect(await getFullPageConfig(true, undefined)).toEqual({});
      });
      test('when main is true and local is undefined', async () => {
        expect(await getFullPageConfig(true, undefined)).toEqual({});
      });
    });
    describe('returns config', () => {
      test('when main is config and local is true', async () => {
        expect(await getFullPageConfig(configDelay, true)).toEqual(configDelay);
      });
      test('when main is true and local is config', async () => {
        expect(await getFullPageConfig(true, configDelay)).toEqual(configDelay);
      });
      test('when main is false and local is config', async () => {
        expect(await getFullPageConfig(true, configDelay)).toEqual(configDelay);
      });
      test('when main is config and local is config', async () => {
        expect(await getFullPageConfig(configDelay, configDelay)).toEqual(
          configDelay,
        );
      });
      test('and local overwrites main config', async () => {
        expect(await getFullPageConfig(configDelay, configDelayBig)).toEqual(
          configDelayBig,
        );
      });
      test('with merged local and main config', async () => {
        const main = { delayAfterScrollMs: 500 };
        const local = { disableCSSAnimation: false };
        expect(await getFullPageConfig(main, local)).toEqual({
          ...main,
          ...local,
        });
      });
      test('with scrollElement when scrollElement is a promise', async () => {
        const elementId = 'elementId';
        const main = {};
        const local = {
          scrollElement: Promise.resolve({ elementId: elementId }),
        };
        expect(
          await getFullPageConfig(main, local, (el) => el.elementId),
        ).toEqual({
          scrollElement: elementId,
        });
      });
      test('with scrollElement when scrollElement is an object', async () => {
        const elementId = 'elementId';
        const main = { scrollElement: { elementId: elementId } };
        const local = {};
        expect(
          await getFullPageConfig(main, local, (el) => el.elementId),
        ).toEqual({
          scrollElement: elementId,
        });
      });
    });
  });
  describe('parseRegionsForAPI', () => {
    test('parsing string values by the resolver', async () => {
      const result = await parseRegionsForAPI(['test'], resolveForTest);
      expect(result.ignoreRegions).toHaveLength(0);
      expect(result.ignoreElements).toEqual([
        {
          id: 'test',
        },
      ]);
    });

    test('parsing region type values by the resolver', async () => {
      const result = await parseRegionsForAPI<string | RegionIn>(
        [
          {
            element: '1',
            enableOnly: ['content'],
          },
          {
            element: '2',
            disableOnly: ['content'],
          },
          {
            element: { x: 1, y: 1, height: 100, width: 100 },
            disableOnly: ['content'],
          },
        ],
        resolveForTest,
      );
      // Expect our results to be consistent when parsing values
      expect(result.ignoreElements[0]).toMatchSnapshot();
      expect(result.ignoreElements[1]).toMatchSnapshot();
      expect(result.ignoreRegions[0]).toMatchSnapshot();
    });
  });
});
