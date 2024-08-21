import { VisualOpts } from './types';
import * as os from 'os';
import {
  Browser,
  DiffingMethod,
  OperatingSystem,
  SauceRegion,
  SnapshotIn,
} from '@saucelabs/visual';
import { OPTS_ENV_KEY } from './constants';
import fs from 'fs/promises';
import { getApi } from './api';

/**
 * Parse ENVs & set options object for visual API usage.
 */
export const getEnvOpts = (): VisualOpts => {
  const {
    SAUCE_USERNAME,
    SAUCE_ACCESS_KEY,
    SAUCE_REGION,
    SAUCE_BUILD_NAME,
    SAUCE_BRANCH_NAME,
    SAUCE_DEFAULT_BRANCH_NAME,
    SAUCE_PROJECT_NAME,
    SAUCE_VISUAL_BUILD_NAME,
    SAUCE_VISUAL_PROJECT,
    SAUCE_VISUAL_BRANCH,
    SAUCE_VISUAL_DEFAULT_BRANCH,
    SAUCE_VISUAL_BUILD_ID,
    SAUCE_VISUAL_CUSTOM_ID,
  } = process.env;

  if (SAUCE_BUILD_NAME) {
    console.warn(
      'Sauce Labs Visual: SAUCE_BUILD_NAME is deprecated and will be removed in a future version. Please use SAUCE_VISUAL_BUILD_NAME instead',
    );
  }
  if (SAUCE_BRANCH_NAME) {
    console.warn(
      'Sauce Labs Visual: SAUCE_BRANCH_NAME is deprecated and will be removed in a future version. Please use SAUCE_VISUAL_BRANCH instead',
    );
  }
  if (SAUCE_DEFAULT_BRANCH_NAME) {
    console.warn(
      'Sauce Labs Visual: SAUCE_DEFAULT_BRANCH_NAME is deprecated and will be removed in a future version. Please use SAUCE_VISUAL_DEFAULT_BRANCH instead',
    );
  }
  if (SAUCE_PROJECT_NAME) {
    console.warn(
      'Sauce Labs Visual: SAUCE_PROJECT_NAME is deprecated and will be removed in a future version. Please use SAUCE_VISUAL_PROJECT instead',
    );
  }

  // Validation for fields is already done inside api package
  return {
    branch: SAUCE_VISUAL_BRANCH || SAUCE_BRANCH_NAME || null,
    defaultBranch:
      SAUCE_VISUAL_DEFAULT_BRANCH || SAUCE_DEFAULT_BRANCH_NAME || null,
    buildId: SAUCE_VISUAL_BUILD_ID ?? null,
    externalBuildId: true,
    project: SAUCE_VISUAL_PROJECT || SAUCE_PROJECT_NAME || null,
    user: SAUCE_USERNAME ?? undefined,
    key: SAUCE_ACCESS_KEY ?? undefined,
    region: (SAUCE_REGION ?? 'us-west-1') as SauceRegion,
    buildName: SAUCE_VISUAL_BUILD_NAME || SAUCE_BUILD_NAME || 'Storybook Build',
    customId: SAUCE_VISUAL_CUSTOM_ID ?? null,
  };
};

/**
 * Parses options / envs and stores them into a settings ENV key to be passed through jest into
 * playwright setup & runtime.
 */
export const parseOpts = () => {
  serializeOpts(getEnvOpts());
};

const serializeOpts = (opts: VisualOpts) => {
  process.env[OPTS_ENV_KEY] = JSON.stringify(opts);
};

export const setOpts = (opts: Partial<VisualOpts>) => {
  serializeOpts({
    ...getOpts(),
    ...opts,
  });
};

export const getOpts = (): VisualOpts => {
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
      `Sauce Visual configuration not detected or could not be parsed. Please check the @saucelabs/visual-storybook docs and ensure \`getVisualTestConfig()\` has been bootstrapped in your \`test-runner-jest.config.js\`${
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
}: {
  browserName: string | undefined;
  browserVersion: string | undefined;
  deviceName: string | undefined;
  devicePixelRatio: number;
  buildId: string;
  name: string;
  ignoreRegions: SnapshotIn['ignoreRegions'];
}): Omit<SnapshotIn, 'uploadId'> => {
  return {
    diffingMethod: DiffingMethod.Balanced,
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

/**
 * Dom capturing script path
 */

export const domScriptPath = `${os.tmpdir()}/sauce-visual-dom-capture.js`;

/**
 * Fetch and save to tmp file dom capturing script
 */

export const downloadDomScript = async () => {
  try {
    const script = await getApi().domCaptureScript();
    script && (await fs.writeFile(domScriptPath, script));
  } catch (err: unknown) {
    console.error(`Cannot get dom capturing script.\n${err}`);
  }
};

/**
 * Get dom capturing script from saved file
 */

export const getDomScript = async () => {
  try {
    return (await fs.readFile(domScriptPath)).toString();
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(err);
    }
  }
};

export const removeDomScriptFile = async () => {
  try {
    await fs.unlink(domScriptPath);
  } catch (err) {
    console.error(err);
  }
};
