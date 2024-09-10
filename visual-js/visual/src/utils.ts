import { type, Type } from 'arktype';
import {
  DiffingOptionsIn,
  ElementIn,
  FullPageConfigIn,
  InputMaybe,
  RegionIn,
} from './graphql/__generated__/graphql';
import { RegionType, VisualEnvOpts } from './types';
import { selectiveRegionOptionsToDiffingOptions } from './common/selective-region';
import { getApi } from './common/api';
import fs from 'fs/promises';
import * as os from 'node:os';
import { SauceRegion } from './common/regions';

export const getFullPageConfig: (
  main?: FullPageConfigIn | boolean,
  local?: FullPageConfigIn | boolean,
) => FullPageConfigIn | undefined = (main, local) => {
  const isNoConfig = !main && !local;
  const isLocalOff = local === false;

  if (isNoConfig || isLocalOff) {
    return;
  }

  const globalCfg = typeof main === 'object' ? main : {};
  const localCfg = typeof local === 'object' ? local : {};
  return { ...globalCfg, ...localCfg };
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
  ignore: (T | RegionIn | RegionType<T> | Promise<RegionIn>)[],
  resolveItem: (
    item: T | Promise<RegionIn>,
  ) => Promise<(RegionIn | ElementIn)[]>,
): Promise<{
  ignoreRegions: RegionIn[];
  ignoreElements: ElementIn[];
}> => {
  const promisedIgnorables: Promise<(RegionIn | ElementIn)[]>[] = ignore.map(
    async (itemOrRegion): Promise<Array<RegionIn | ElementIn>> => {
      const { item, diffingOptions } = isRegionType(itemOrRegion)
        ? {
            item: itemOrRegion.element,
            diffingOptions: getDiffingOptions(itemOrRegion),
          }
        : { item: itemOrRegion, diffingOptions: undefined };

      const elements = isIgnoreRegion(item) ? [item] : await resolveItem(item);
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
    console.error(err);
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
