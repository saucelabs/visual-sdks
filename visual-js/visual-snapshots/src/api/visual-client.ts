import { getApi, VisualConfig } from "@saucelabs/visual";

export const visualApiInitializer =
  (_getApi: typeof getApi) => (params: VisualConfig, clientVersion: string) =>
    _getApi(params, {
      userAgent: `visual-snapshots/${clientVersion}`,
    });

export const initializeVisualApi = visualApiInitializer(getApi);
