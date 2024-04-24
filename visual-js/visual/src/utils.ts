import { FullPageConfigIn } from './graphql/__generated__/graphql';

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
