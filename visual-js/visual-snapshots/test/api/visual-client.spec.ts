import { initializeVisualApi } from "../../src/api/visual-client.js";
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
      user: "fake-username",
      key: "fake-access-key",
      region: "us-west-1",
    } as sauceVisual.VisualConfig;
    initializeVisualApi(params);

    expect(getApiSpy).toHaveBeenCalledWith(params, {
      userAgent: "visual-snapshots/PKG_VERSION",
    });
  });
});
