import { type, Type } from 'arktype';
import {
  DiffingOptionsIn,
  ElementIn,
  FullPageConfigIn,
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

export const getDiffingOptions = <T>(
  region: RegionType<T>,
): DiffingOptionsIn | undefined => {
  const { element: __, ...rest } = region;
  if ('enableOnly' in rest || 'disableOnly' in rest) {
    return selectiveRegionOptionsToDiffingOptions(rest);
  }
  return undefined;
};

/**
 * Parse ignore elements, regions, and selective regions and format them for use with the API
 * @param ignore
 * @param isElement A callback to check whether an item is a web element, depending on framework implementation.
 * @param getElementMeta A callback to gather the required metadata from an element for use with the API.
 */
export const parseRegionsForAPI = async <T>(
  ignore: RegionType<T>[],
  isElement: (element: unknown) => element is T,
  getElementMeta: (
    element: T,
  ) => { id: string; name?: string } | Promise<{ id: string; name?: string }>,
): Promise<{
  ignoreRegions: RegionIn[];
  ignoreElements: ElementIn[];
}> => {
  const ignoreElements: ElementIn[] = [];
  const ignoreRegions: RegionIn[] = [];

  const pushElement = async (region: RegionType<T>) => {
    const { element: maybePromiseElement, ...other } = region;
    const element = await maybePromiseElement;

    if (Array.isArray(element)) {
      for await (const subElement of element) {
        await pushElement({
          element: subElement,
          ...other,
        });
      }
    } else if (isElement(element)) {
      // check if this is an element, by letting each framework define what an element is, then
      // extract the required metadata from an element to pass to the backend.
      const { id, name } = await getElementMeta(element);
      ignoreElements.push({
        id,
        name,
        diffingOptions: getDiffingOptions(region),
      });
    } else if (isIgnoreRegion(element)) {
      ignoreRegions.push({
        ...element,
        diffingOptions: getDiffingOptions(region),
      });
    }
  };

  for await (const region of ignore) {
    await pushElement(region);
  }

  return {
    ignoreRegions,
    ignoreElements,
  };
};
