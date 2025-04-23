import {
  Browser,
  DiffingMethod,
  DiffingMethodSensitivity,
  DiffingMethodToleranceIn,
  getEnvOpts,
  OperatingSystem,
  SnapshotIn,
} from '@saucelabs/visual';
import * as os from 'node:os';

import { OPTS_ENV_KEY } from './constants';
import { PlaywrightEnvOpts } from './types';

/**
 * Parses options / envs and stores them into a settings ENV key to be passed through jest into
 * playwright setup & runtime.
 */
export const parseOpts = () => {
  serializeOpts({
    ...getEnvOpts(),
    externalBuildId: true,
  });
};

const serializeOpts = <T extends PlaywrightEnvOpts>(opts: T) => {
  process.env[OPTS_ENV_KEY] = JSON.stringify(opts);
};

export const setOpts = <T extends PlaywrightEnvOpts>(opts: Partial<T>) => {
  serializeOpts({
    ...getOpts(),
    ...opts,
  });
};

export const getOpts = <T extends PlaywrightEnvOpts>(): T => {
  const envOpts = process.env[OPTS_ENV_KEY];
  try {
    if (!envOpts) {
      throw new Error('Sauce Visual configuration is empty.');
    }

    return JSON.parse(envOpts);
  } catch (error) {
    let message;
    if (error instanceof Error) {
      message = error.message;
    }

    throw new Error(
      `Sauce Visual configuration not detected or could not be parsed. Please check the @saucelabs/visual-playwright docs and ensure \`getVisualTestConfig()\` has been bootstrapped in your \`test-runner-jest.config.js\`${
        message ? `Full message: ${message}` : ''
      }`,
    );
  }
};

/**
 * Parses Playwright's browserType.name() to convert known strings into enums.
 */
export const getKnownBrowserType = (
  browserType?: string | 'chromium' | 'firefox' | 'webkit',
): Browser | null => {
  switch (browserType) {
    case 'chromium':
      return Browser.Chrome;
    case 'firefox':
      return Browser.Firefox;
    case 'webkit':
      return Browser.PlaywrightWebkit;
    default:
      return null;
  }
};

/**
 * Parses the current OS platform as a known enum type.
 */
export const getKnownOsType = (): OperatingSystem | null => {
  switch (os.platform()) {
    case 'android':
      return OperatingSystem.Android;
    case 'darwin':
      return OperatingSystem.Macos;
    case 'win32':
    case 'cygwin':
      return OperatingSystem.Windows;
    case 'freebsd':
    case 'linux':
    case 'openbsd':
    case 'netbsd':
      return OperatingSystem.Linux;
    default:
      return null;
  }
};

/**
 * Aggregates snapshot metadata into a snapshot input object for the graphql API.
 */
export const buildSnapshotMetadata = ({
  browserName,
  browserVersion,
  deviceName,
  devicePixelRatio,
  buildId,
  name,
  ignoreRegions,
  diffingMethod,
  diffingMethodTolerance,
  diffingMethodSensitivity,
}: {
  browserName: string | undefined;
  browserVersion: string | undefined;
  deviceName: string | undefined;
  devicePixelRatio: number;
  buildId: string;
  name: string;
  ignoreRegions: SnapshotIn['ignoreRegions'];
  diffingMethod: DiffingMethod | undefined;
  diffingMethodTolerance?: DiffingMethodToleranceIn;
  diffingMethodSensitivity?: DiffingMethodSensitivity;
}): Omit<SnapshotIn, 'uploadId'> => {
  return {
    diffingMethod: diffingMethod || DiffingMethod.Balanced,
    diffingMethodTolerance,
    diffingMethodSensitivity,
    browser: getKnownBrowserType(browserName),
    browserVersion: browserVersion ? `Playwright - ${browserVersion}` : null,
    buildUuid: buildId,
    device: deviceName || 'Desktop',
    devicePixelRatio,
    ignoreRegions,
    name,
    operatingSystem: getKnownOsType(),
    operatingSystemVersion: null,
    suiteName: null,
    testName: null,
  };
};
