import { getApi, VisualConfig } from "@saucelabs/visual";

export const initializeVisualApi = (params: VisualConfig) =>
  getApi(params, {
    userAgent: "visual-snapshots",
  });
