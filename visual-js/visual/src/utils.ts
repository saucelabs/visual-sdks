import { type, Type } from 'arktype';
import {
  DiffingOptionsIn,
  ElementIn,
  FullPageConfigIn,
  InputMaybe,
  RegionIn,
} from './graphql/__generated__/graphql';
import { RegionType } from './types';
import { selectiveRegionOptionsToDiffingOptions } from './selective-region';

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
