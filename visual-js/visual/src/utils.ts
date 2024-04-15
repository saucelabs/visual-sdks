import { FullPageConfigIn } from './graphql/__generated__/graphql';

export const getFullPageConfig: (
  fullPage?: FullPageConfigIn | boolean,
) => FullPageConfigIn | undefined = (fullPage) => {
  if (!fullPage) {
    return;
  } else if (typeof fullPage === 'boolean') {
    return {};
  }

  return fullPage;
};
