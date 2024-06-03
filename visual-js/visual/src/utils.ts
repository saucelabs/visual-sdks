import { type, Type } from 'arktype';
import {
  DiffingOptionsIn,
  ElementIn,
  FullPageConfigIn,
  InputMaybe,
  RegionIn,
} from './graphql/__generated__/graphql';
import { ElementMeta, RegionType } from './types';
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
 * @param getElementMeta A callback to gather the required metadata from an element for use with the API.
 */
export const parseRegionsForAPI = async <T>(
  ignore: RegionType<T>[],
  getElementMeta: (element: unknown | T) => Promise<ElementMeta | null>,
): Promise<{
  ignoreRegions: RegionIn[];
  ignoreElements: ElementIn[];
}> => {
  const ignorables: Array<RegionIn | ElementIn> = (
    await Promise.all(
      ignore.map(async (region) => {
        const { element: awaitable } = region;
        const element = await awaitable;
        const subElements = await Promise.all(
          Array.isArray(element) ? element : [element],
        );
        return await Promise.all(
          subElements.map(async (sub) => {
            const elementMeta = await getElementMeta(sub);
            return elementMeta
              ? {
                  ...elementMeta,
                  diffingOptions: getDiffingOptions(region),
                }
              : undefined;
          }),
        );
      }),
    )
  )
    .flat()
    .filter((region): region is Exclude<typeof region, undefined> =>
      Boolean(region),
    );

  const ignoreElements = ignorables.filter(
    (region): region is ElementIn => 'id' in region,
  );
  const ignoreRegions = ignorables.filter((region): region is RegionIn =>
    isIgnoreRegion(region),
  );

  return {
    ignoreRegions,
    ignoreElements,
  };
};
