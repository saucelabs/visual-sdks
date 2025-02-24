import { DiffingMethod, VisualApi } from "@saucelabs/visual";
import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../../src/api/visual-snapshots-api.js";

async function* pdfPagesGenerator(): AsyncGenerator<Buffer> {
  for (let i = 0; i < 2; ++i) {
    yield Promise.resolve(Buffer.from(`fake-image-buffer-${i}`));
  }
}

describe("VisualSnapshots", () => {
  describe("generateAndSendPdfFileSnapshots", () => {
    const consoleInfoSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => {});

    let pdfPages: AsyncGenerator<Buffer>;

    const createBuildMock = jest.fn();
    const uploadSnapshotMock = jest.fn();
    const createSnapshotMock = jest.fn();
    const finishBuildMock = jest.fn();
    const visualApiMock: VisualApi = {
      ...jest.requireActual<VisualApi>("@saucelabs/visual"),
      createBuild: createBuildMock,
      uploadSnapshot: uploadSnapshotMock,
      createSnapshot: createSnapshotMock,
      finishBuild: finishBuildMock,
    };
    const visualSnapshots = new VisualSnapshotsApi(visualApiMock);

    beforeEach(() => {
      createBuildMock.mockReset();
      createBuildMock.mockReturnValueOnce(Promise.resolve({ id: "build-id" }));
      uploadSnapshotMock.mockReset();
      uploadSnapshotMock
        .mockReturnValueOnce(Promise.resolve("upload-id-0"))
        .mockReturnValueOnce(Promise.resolve("upload-id-1"));
      createSnapshotMock.mockReset();
      finishBuildMock.mockReset();
      consoleInfoSpy.mockReset();

      pdfPages = pdfPagesGenerator();
    });

    const assertSuccessfulPdfSnapshotsGeneration = (
      params: CreateVisualSnapshotsParams,
    ) => {
      expect(createBuildMock).toHaveBeenCalledWith({
        name: params.buildName,
        branch: params.branch,
        defaultBranch: params.defaultBranch,
        project: params.project,
        customId: params.customId,
      });

      expect(uploadSnapshotMock.mock.calls).toEqual([
        [
          {
            buildId: "build-id",
            image: { data: Buffer.from("fake-image-buffer-0") },
          },
        ],
        [
          {
            buildId: "build-id",
            image: { data: Buffer.from("fake-image-buffer-1") },
          },
        ],
      ]);

      expect(createSnapshotMock.mock.calls).toEqual([
        [
          {
            diffingMethod: DiffingMethod.Balanced,
            buildUuid: "build-id",
            name: "page-1",
            uploadUuid: "upload-id-0",
          },
        ],
        [
          {
            diffingMethod: DiffingMethod.Balanced,
            buildUuid: "build-id",
            name: "page-2",
            uploadUuid: "upload-id-1",
          },
        ],
      ]);

      expect(finishBuildMock).toHaveBeenCalledWith({
        uuid: "build-id",
      });

      expect(consoleInfoSpy.mock.calls).toEqual([
        ["Build build-id created."],
        ["Uploaded image to build build-id: upload id=upload-id-0."],
        ["Created a snapshot page-1 for build build-id."],
        ["Uploaded image to build build-id: upload id=upload-id-1."],
        ["Created a snapshot page-2 for build build-id."],
        ["Build build-id finished."],
      ]);
    };

    test("with params", async () => {
      const params = {
        branch: "fake-branch",
        buildName: "fake-build-name",
        defaultBranch: "fake-default-branch",
        project: "fake-project",
        customId: "fake-custom-id",
        buildId: "fake-build-id",
      } as CreateVisualSnapshotsParams;
      await visualSnapshots.generateAndSendPdfFileSnapshots(pdfPages, params);

      assertSuccessfulPdfSnapshotsGeneration(params);
    });

    test("without params", async () => {
      const params = {} as CreateVisualSnapshotsParams;
      await visualSnapshots.generateAndSendPdfFileSnapshots(pdfPages, params);

      assertSuccessfulPdfSnapshotsGeneration(params);
    });
  });
});
