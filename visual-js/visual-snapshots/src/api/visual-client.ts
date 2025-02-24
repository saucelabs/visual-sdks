import { getApi, SauceRegion } from "@saucelabs/visual";

export interface VisualApiParams {
  username: string;
  accessKey: string;
  region: SauceRegion;
}

export const initializeVisualApi = (params: VisualApiParams) =>
  getApi(
    {
      user: params.username,
      key: params.accessKey,
      region: params.region,
    },
    {
      userAgent: "visual-snapshots",
    },
  );
