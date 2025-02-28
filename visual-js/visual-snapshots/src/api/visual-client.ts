import { getApi, VisualConfig } from "@saucelabs/visual";

export const initializeVisualApi = (
  params: VisualConfig,
  clientVersion: string
) =>
  getApi(params, {
    userAgent: `visual-snapshots/${clientVersion}`,
  });
