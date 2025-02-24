import {
  initializeVisualApi,
  VisualApiParams,
} from "../../src/api/visual-client.js";
import * as sauceVisual from "@saucelabs/visual";

jest.mock("@saucelabs/visual", () => {
  return {
    getApi: jest.fn(),
  };
});

describe("visual api client", () => {
  test("initializeVisualApi", async () => {
    const getApiSpy = sauceVisual.getApi;

    const params = {
      username: "fake-username",
      accessKey: "fake-access-key",
      region: "us-west-1",
    } as VisualApiParams;
    await initializeVisualApi(params);

    expect(getApiSpy).toHaveBeenCalledWith(
      {
        user: params.username,
        key: params.accessKey,
        region: params.region,
      },
      {
        userAgent: "visual-snapshots",
      },
    );
  });
});
