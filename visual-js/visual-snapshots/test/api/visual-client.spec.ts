import { visualApiInitializer } from "../../src/api/visual-client.js";
import * as sauceVisual from "@saucelabs/visual";

jest.mock("@saucelabs/visual", () => {
  return {
    getApi: jest.fn(),
  };
});

describe("visual api client", () => {
  test("visualApiInitializer", async () => {
    const getApiSpy = jest.fn();
    const initializeVisualApi = visualApiInitializer(getApiSpy);

    const pkgVersion = "0.1.0";
    const params = {
      user: "fake-username",
      key: "fake-access-key",
      region: "us-west-1",
    } as sauceVisual.VisualConfig;
    initializeVisualApi(params, pkgVersion);

    expect(getApiSpy).toHaveBeenCalledWith(params, {
      userAgent: `visual-snapshots/${pkgVersion}`,
    });
  });
});
