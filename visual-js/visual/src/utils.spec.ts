import { describe, expect, test } from '@jest/globals';
import { getFullPageConfig } from './utils';
import { FullPageConfigIn } from './graphql/__generated__/graphql';

const configDelay: FullPageConfigIn = {
  delayAfterScrollMs: 1500,
};

const configDelayBig: FullPageConfigIn = {
  delayAfterScrollMs: 5000,
};

describe('utils', () => {
  describe('getFullPageConfig', () => {
    describe('returns undefined', () => {
      test('when main is true and local is false', () => {
        expect(getFullPageConfig(true, false)).toBeUndefined();
      });
      test('when main is false and local is false', () => {
        expect(getFullPageConfig(false, false)).toBeUndefined();
      });
      test('when main is false and local is false', () => {
        expect(getFullPageConfig(false, false)).toBeUndefined();
      });
      test('when main is object and local is false', () => {
        expect(getFullPageConfig(configDelay, false)).toBeUndefined();
      });
      test('when main is undefined and local is false', () => {
        expect(getFullPageConfig(undefined, false)).toBeUndefined();
      });
      test('when main is undefined and local is undefined', () => {
        expect(getFullPageConfig(undefined, undefined)).toBeUndefined();
      });
      test('when main is false and local is undefined', () => {
        expect(getFullPageConfig(false, undefined)).toBeUndefined();
      });
    });
    describe('returns empty config', () => {
      test('when main is true and local is true', () => {
        expect(getFullPageConfig(true, undefined)).toEqual({});
      });
      test('when main is false and local is true', () => {
        expect(getFullPageConfig(true, undefined)).toEqual({});
      });
      test('when main is undefined and local is true', () => {
        expect(getFullPageConfig(true, undefined)).toEqual({});
      });
      test('when main is true and local is undefined', () => {
        expect(getFullPageConfig(true, undefined)).toEqual({});
      });
    });
    describe('returns config', () => {
      test('when main is config and local is true', () => {
        expect(getFullPageConfig(configDelay, true)).toEqual(configDelay);
      });
      test('when main is true and local is config', () => {
        expect(getFullPageConfig(true, configDelay)).toEqual(configDelay);
      });
      test('when main is false and local is config', () => {
        expect(getFullPageConfig(true, configDelay)).toEqual(configDelay);
      });
      test('when main is config and local is config', () => {
        expect(getFullPageConfig(configDelay, configDelay)).toEqual(
          configDelay,
        );
      });
      test('and local overwrites main config', () => {
        expect(getFullPageConfig(configDelay, configDelayBig)).toEqual(
          configDelayBig,
        );
      });
      test('with merged local and main config', () => {
        const main = { delayAfterScrollMs: 500 };
        const local = { disableCSSAnimation: false };
        expect(getFullPageConfig(main, local)).toEqual({ ...main, ...local });
      });
    });
  });
});
