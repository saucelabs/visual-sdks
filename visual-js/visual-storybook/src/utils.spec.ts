import { describe, expect, it } from '@jest/globals';
import { getOpts } from './utils';
import { DEFAULT_OPTS, OPTS_ENV_KEY } from './constants';

describe('utils', () => {
  describe('getOpts', () => {
    it('should throw if ENV value is empty', () => {
      expect(() => {
        getOpts();
      }).toThrow('Sauce Visual configuration is empty.');
    });

    it('should throw if ENV value is unserializable', () => {
      process.env[OPTS_ENV_KEY] = '`';
      expect(() => {
        getOpts();
      }).toThrow(
        /Sauce Visual configuration not detected or could not be parsed/,
      );
    });

    it('should parse the ENV values', () => {
      process.env[OPTS_ENV_KEY] = JSON.stringify({
        ...DEFAULT_OPTS,
        user: 'SAUCE_USERNAME',
        key: 'SAUCE_ACCESS_KEY',
      });

      const result = getOpts();

      expect(result.key).toEqual('SAUCE_ACCESS_KEY');
      expect(result.user).toEqual('SAUCE_USERNAME');
    });
  });
});
