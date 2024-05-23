import { type, Type } from 'arktype';
import { FullPageConfigIn, RegionIn } from './graphql/__generated__/graphql';

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
