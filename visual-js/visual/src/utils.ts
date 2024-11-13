import { type, Type } from 'arktype';
import {
  DiffingOptionsIn,
  DiffStatus,
  ElementIn,
  FullPageConfigIn,
  IgnoreSelectorIn,
  InputMaybe,
  RegionIn,
  SelectorType,
} from './graphql/__generated__/graphql';
import { FullPageScreenshotOptions, RegionType, VisualEnvOpts } from './types';
import { selectiveRegionOptionsToDiffingOptions } from './common/selective-region';
import { getApi, VisualApi } from './common/api';
import fs from 'fs/promises';
import * as os from 'node:os';
import { SauceRegion } from './common/regions';
import { backOff } from 'exponential-backoff';

export const getFullPageConfig: <T>(
  main?: FullPageScreenshotOptions<T> | boolean,
  local?: FullPageScreenshotOptions<T> | boolean,
  getId?: (el: T) => Promise<string> | string,
) => Promise<FullPageConfigIn | undefined> = async (main, local, getId) => {
  const isNoConfig = !main && !local;
  const isLocalOff = local === false;

  if (isNoConfig || isLocalOff) {
    return;
  }

  const globalCfg: typeof main = typeof main === 'object' ? main : {};
  const localCfg: typeof main = typeof local === 'object' ? local : {};
  const { scrollElement, ...rest } = { ...globalCfg, ...localCfg };
  const result: FullPageConfigIn = rest;
  if (scrollElement && getId) {
    result.scrollElement = await getId(await scrollElement);
  }

  return result;
};

export const isSkipMode = (): boolean => {
  const VISUAL_SKIP_ENV_VAR = 'SAUCE_VISUAL_SKIP';
  return Boolean(process.env[VISUAL_SKIP_ENV_VAR]);
};

export const makeValidate =
  <T extends Type<any>>(t: T) =>
  (x: unknown): T['infer'] => {
    const { data, problems } = t(x);
    if (problems) {
      throw new Error(problems.toLocaleString());
    }
    return data;
  };

const ignoreRegionType: Type<RegionIn> = type({
  width: 'integer',
  height: 'integer',
  x: 'integer',
  y: 'integer',
  'name?': 'string | null | undefined',
});

export const isIgnoreRegion = ignoreRegionType.allows;

export const validateIgnoreRegion = makeValidate(ignoreRegionType);

const elementIn: Type<ElementIn> = type({
  id: 'string',
  'name?': 'string | undefined',
});
export const isElementIn = elementIn.allows;
export const validateElementIn = makeValidate(elementIn);

const regionType: Type<RegionType<unknown>> = type([
  {
    element: 'unknown',
    enableOnly: 'any',
  },
  '|',
  {
    element: 'unknown',
    disableOnly: 'any',
  },
]);
export const isRegionType = (item: unknown): item is RegionType<unknown> =>
  typeof item === 'object' && regionType.allows(item);

// arktype has problem to check enums
export const isIgnoreSelectorType = (item: any): item is IgnoreSelectorIn =>
  typeof item === 'object' &&
  typeof item.selector === 'object' &&
  Object.values(SelectorType).includes(item.selector.type) &&
  typeof item.selector.value === 'string';
export const validateRegionType = makeValidate(elementIn);

export const getDiffingOptions = <T>(
  region: RegionType<T>,
): InputMaybe<DiffingOptionsIn> | undefined => {
  const { element: __, ...rest } = region;
  if ('enableOnly' in rest || 'disableOnly' in rest) {
    return selectiveRegionOptionsToDiffingOptions(rest);
  }
  return undefined;
};

/**
 * Parse ignore elements, regions, and selective regions and format them for use with the API
 * @param ignore
 * @param resolveItem A callback to resolve an element and gather the required data for the API.
 */
export const parseRegionsForAPI = async <T>(
  ignore: (
    | T
    | RegionIn
    | RegionType<T>
    | Promise<RegionIn>
    | IgnoreSelectorIn
  )[],
  resolveItem: (
    item: T | Promise<RegionIn>,
  ) => Promise<(RegionIn | ElementIn | IgnoreSelectorIn)[]>,
): Promise<{
  ignoreRegions: RegionIn[];
  ignoreElements: ElementIn[];
  ignoreSelectors: IgnoreSelectorIn[];
}> => {
  const promisedIgnorables: Promise<
    (RegionIn | ElementIn | IgnoreSelectorIn)[]
  >[] = ignore.map(
    async (
      itemOrRegionOrSelector,
    ): Promise<Array<RegionIn | ElementIn | IgnoreSelectorIn>> => {
      const { item, diffingOptions } = (() => {
        if (isRegionType(itemOrRegionOrSelector)) {
          return {
            item: itemOrRegionOrSelector.element,
            diffingOptions: getDiffingOptions(itemOrRegionOrSelector),
          };
        } else if (isIgnoreSelectorType(itemOrRegionOrSelector)) {
          return {
            item: itemOrRegionOrSelector,
            diffingOptions: itemOrRegionOrSelector.diffingOptions,
          };
        }

        return { item: itemOrRegionOrSelector, diffingOptions: undefined };
      })();

      const elements =
        isIgnoreRegion(item) || isIgnoreSelectorType(item)
          ? [item]
          : await resolveItem(item);
      return elements.map((element) => ({
        ...element,
        diffingOptions,
      }));
    },
  );

  const flattened = (await Promise.all(promisedIgnorables)).flat();

  return {
    ignoreRegions: flattened.filter(isIgnoreRegion),
    ignoreElements: flattened.filter(isElementIn),
    ignoreSelectors: flattened.filter(isIgnoreSelectorType),
  };
};

/**
 * Dom capturing script path
 */

export const domScriptPath = `${os.tmpdir()}/sauce-visual-dom-capture.js`;

/**
 * Fetch and save to tmp file dom capturing script
 */

export const downloadDomScript = async (api: ReturnType<typeof getApi>) => {
  try {
    const script = await api.domCaptureScript();
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
    // Catch and log no errors. If the file isn't present this is noop.
  }
};

/**
 * Parse ENVs & set options object for visual API usage.
 */
export const getEnvOpts = (): VisualEnvOpts => {
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
    project: SAUCE_VISUAL_PROJECT || SAUCE_PROJECT_NAME || null,
    user: SAUCE_USERNAME ?? undefined,
    key: SAUCE_ACCESS_KEY ?? undefined,
    region: (SAUCE_REGION ?? 'us-west-1') as SauceRegion,
    buildName:
      SAUCE_VISUAL_BUILD_NAME || SAUCE_BUILD_NAME || 'Sauce Visual Build',
    customId: SAUCE_VISUAL_CUSTOM_ID ?? null,
  };
};

/**
 * Get the result summary for the requested build & diff IDs.
 */
export const getVisualResults = async (
  api: VisualApi,
  filter: { buildId: string | null | undefined; diffIds: string[] },
) => {
  const { buildId, diffIds } = filter;
  const initialStatusSummary: Record<DiffStatus, number> = {
    [DiffStatus.Approved]: 0,
    [DiffStatus.Equal]: 0,
    [DiffStatus.Unapproved]: 0,
    [DiffStatus.Rejected]: 0,
    [DiffStatus.Queued]: 0,
    [DiffStatus.Errored]: 0,
  };

  if (!buildId) {
    throw new Error(
      'No Sauce Visual build present, cannot determine visual results.',
    );
  }

  // Bypass all API requests if we have been passed no uploaded diff IDs. Would allow someone to
  // add this check / hook globally and for us to only make requests when diffs are present.
  if (diffIds.length === 0) {
    return initialStatusSummary;
  }

  return await backOff(
    async () => {
      const summary = { ...initialStatusSummary };
      const diffsForTestResult = await api.diffsForTestResult(buildId);
      if (!diffsForTestResult) {
        return summary;
      }

      const filterDiffsById = (diff: { id: string; status: DiffStatus }) =>
        diffIds.includes(diff.id);

      const statusSummary = diffsForTestResult.nodes
        .filter(filterDiffsById)
        .reduce((statusSummary, diff) => {
          statusSummary[diff.status]++;
          return statusSummary;
        }, summary);

      if (statusSummary[DiffStatus.Queued] > 0) {
        throw new Error('Some diffs are still in the queued state.');
      }

      return statusSummary;
    },
    {
      maxDelay: 10000,
      numOfAttempts: 10,
    },
  );
};
