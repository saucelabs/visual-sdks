import { getApi, VisualConfig } from "@saucelabs/visual";

const clientVersion = "PKG_VERSION";

export const initializeVisualApi = (params: VisualConfig) =>
  getApi(params, {
    userAgent: `visual-snapshots/${clientVersion}`,
  });
