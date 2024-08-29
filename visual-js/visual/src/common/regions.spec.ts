import { describe, expect, test } from '@jest/globals';
import {
  VisualApiRegion,
  regions,
  resolveRegionFromOndemandHostname,
} from './regions';

describe('region names', () => {
  const names: { [key: string]: number } = {};
  for (const r of regions) {
    names[r.name] = (names[r.name] ?? 0) + 1;
    for (const alias of r.aliases) {
      names[alias] = (names[alias] ?? 0) + 1;
    }
  }

  for (const key of Object.keys(names)) {
    test(`"${key}" is unique`, () => {
      expect(names[key]).toBe(1);
    });
  }
});

describe('regions', () => {
  test('jobUrl have a placeholder', () => {
    for (const r of regions) {
      expect(r.jobUrlTemplate).toContain('JOB_ID');
    }
  });

  test('jobUrl have a placeholder', () => {
    const r = VisualApiRegion.fromName('us-west-1');
    expect(r.jobUrl('4242')).toContain('4242');
  });

  describe('getDatacenterByName', () => {
    test('finds existing region by name', () => {
      const region = VisualApiRegion.fromName('us-west-1');
      expect(region).toBeDefined();
    });

    test('finds existing region by alias', () => {
      const region = VisualApiRegion.fromName('us');
      expect(region).toBeDefined();
    });

    test('finds existing region by alias', () => {
      expect(() => {
        VisualApiRegion.fromName('zz');
      }).toThrowError();
    });
  });

  describe('resolveRegionFromOndemandHostname', () => {
    const testCases = [
      {
        input: 'ondemand.saucelabs.com',
        region: 'us-west-1',
      },
      {
        input: 'ondemand.us-west-1.saucelabs.com',
        region: 'us-west-1',
      },
      {
        input: 'ondemand.us-east-4.saucelabs.com',
        region: 'us-east-4',
      },
      {
        input: 'ondemand.eu-central-1.saucelabs.com',
        region: 'eu-central-1',
      },
      {
        input: 'ondemand.staging.saucelabs.net',
        region: 'staging',
      },
      {
        input: 'unknown.saucelabs.net',
        region: undefined,
      },
    ];
    for (const tc of testCases) {
      test(`${tc.input} is resolved as ${tc.region}`, () => {
        const region = resolveRegionFromOndemandHostname(tc.input);
        expect(region).toEqual(tc.region);
      });
    }
  });
});
