import { describe, expect, jest, test } from '@jest/globals';
import {
  getFullPageConfig,
  getVisualResults,
  parseRegionsForAPI,
} from './utils';
import { DiffStatus, RegionIn } from './graphql/__generated__/graphql';
import { FullPageScreenshotOptions } from './types';
import { getApi, VisualConfig } from './common/api';

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

jest.mock('@wdio/logger', () => () => ({ default: jest.fn() }));
jest.mock('chalk', () => ({ default: jest.fn() }));

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

  describe('getVisualResults', () => {
    const config: VisualConfig = { region: 'us', user: 'u', key: 'k' };
    const api = getApi(config);
    const diffsForTestResult = jest.spyOn(api, 'diffsForTestResult');

    test('Should throw an error if a build id is not present', async () => {
      diffsForTestResult.mockReset();
      diffsForTestResult.mockImplementation(() => {
        return Promise.resolve({ nodes: [] });
      });
      await expect(
        getVisualResults(api, {
          buildId: null,
          diffIds: [],
        }),
      ).rejects.toThrowError(
        'No Sauce Visual build present, cannot determine visual results.',
      );
    });

    test('Should return no unapproved diffs when there are no diffs at all', async () => {
      diffsForTestResult.mockReset();
      diffsForTestResult.mockImplementation(() => {
        return Promise.resolve({ nodes: [] });
      });
      const result = await getVisualResults(api, {
        buildId: '123',
        diffIds: [],
      });
      expect(result.UNAPPROVED).toEqual(0);
      expect(diffsForTestResult).not.toBeCalled();
    });

    test('Should return no unapproved diffs when there are only equal diffs', async () => {
      diffsForTestResult.mockReset();
      diffsForTestResult.mockImplementationOnce(() => {
        return Promise.resolve({
          nodes: [
            { id: '1', status: DiffStatus.Approved },
            { id: '2', status: DiffStatus.Approved },
          ],
        });
      });
      const result = await getVisualResults(api, {
        buildId: '123',
        diffIds: ['1', '2'],
      });
      expect(result.APPROVED).toEqual(2);
    });

    test('Should return unapproved diffs when there are unapproved diffs', async () => {
      diffsForTestResult.mockReset();
      diffsForTestResult
        .mockImplementationOnce(() => {
          return Promise.resolve({
            nodes: [{ id: '1', status: DiffStatus.Queued }],
          });
        })
        .mockImplementationOnce(() => {
          return Promise.resolve({
            nodes: [{ id: '1', status: DiffStatus.Unapproved }],
          });
        });
      const result = await getVisualResults(api, {
        buildId: '123',
        diffIds: ['1', '2'],
      });
      expect(result.UNAPPROVED).toEqual(1);
    });
  });
});
