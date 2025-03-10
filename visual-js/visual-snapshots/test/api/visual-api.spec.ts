import { BuildStatus, DiffingMethod, VisualApi } from "@saucelabs/visual";
import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../../src/api/visual-snapshots-api.js";
import { formatString } from "../../src/utils/format.js";

async function* pdfPagesGenerator(): AsyncGenerator<Buffer> {
  for (let i = 0; i < 2; ++i) {
    yield Promise.resolve(Buffer.from(`fake-image-buffer-${i}`));
  }
}

describe("VisualSnapshots", () => {
  describe("generateAndSendPdfFileSnapshots", () => {
    const consoleInfoSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    let pdfPages: AsyncGenerator<Buffer>;

    const createBuildMock = jest.fn();
    const uploadSnapshotMock = jest.fn();
    const createSnapshotMock = jest.fn();
    const finishBuildMock = jest.fn();
    const buildStatusMock = jest.fn();
    const visualApiMock: VisualApi = {
      ...jest.requireActual<VisualApi>("@saucelabs/visual"),
      createBuild: createBuildMock,
      uploadSnapshot: uploadSnapshotMock,
      createSnapshot: createSnapshotMock,
      finishBuild: finishBuildMock,
      buildStatus: buildStatusMock,
    };
    const visualSnapshots = new VisualSnapshotsApi(visualApiMock);
    beforeEach(() => {
      createBuildMock.mockReset();
      createBuildMock.mockReturnValueOnce(
        Promise.resolve({ id: "build-id", url: "http://build-url/build-id" })
      );
      uploadSnapshotMock.mockReset();
      uploadSnapshotMock
        .mockReturnValueOnce(Promise.resolve("upload-id-0"))
        .mockReturnValueOnce(Promise.resolve("upload-id-1"));
      createSnapshotMock.mockReset();
      finishBuildMock.mockReset();
      buildStatusMock.mockReset();
      consoleInfoSpy.mockReset();

      pdfPages = pdfPagesGenerator();
    });

    const assertSuccessfulPdfSnapshotsGeneration = (
      filename: string,
      params: CreateVisualSnapshotsParams
    ) => {
      if (!params.buildId) {
        expect(createBuildMock).toHaveBeenCalledWith({
          name: params.buildName,
          branch: params.branch,
          defaultBranch: params.defaultBranch,
          project: params.project,
          customId: params.customId,
        });
      }

      expect(uploadSnapshotMock.mock.calls).toEqual([
        [
          {
            buildId: params.buildId ?? "build-id",
            image: { data: Buffer.from("fake-image-buffer-0") },
          },
        ],
        [
          {
            buildId: params.buildId ?? "build-id",
            image: { data: Buffer.from("fake-image-buffer-1") },
          },
        ],
      ]);

      expect(createSnapshotMock.mock.calls).toEqual([
        [
          {
            diffingMethod: DiffingMethod.Balanced,
            buildId: params.buildId ?? "build-id",
            name: formatString(params.snapshotName ?? "page-{page}", {
              filename,
              page: 1,
            }),
            uploadId: "upload-id-0",
            suiteName: params.suiteName,
            testName: params.testName
              ? formatString(params.testName, {
                  filename,
                })
              : undefined,
          },
        ],
        [
          {
            diffingMethod: DiffingMethod.Balanced,
            buildId: params.buildId ?? "build-id",
            name: formatString(params.snapshotName ?? "page-{page}", {
              filename,
              page: 2,
            }),
            uploadId: "upload-id-1",
            suiteName: params.suiteName,
            testName: params.testName
              ? formatString(params.testName, {
                  filename,
                })
              : undefined,
          },
        ],
      ]);

      expect(finishBuildMock).toHaveBeenCalledWith({
        uuid: params.buildId ?? "build-id",
      });

      expect(buildStatusMock).toHaveBeenCalledWith(
        params.buildId ?? "build-id"
      );

      expect(consoleInfoSpy.mock.calls).toMatchSnapshot();
    };

    describe("with params", () => {
      const filename = "filename.pdf";
      const params = {
        branch: "fake-branch",
        buildName: "fake-build-name",
        defaultBranch: "fake-default-branch",
        project: "fake-project",
        customId: "fake-custom-id",
        snapshotName: "custom-snapshot-name-{filename}-{page}",
        suiteName: "custom-suite-name",
        testName: "custom-test-name-{filename}",
      } satisfies CreateVisualSnapshotsParams;

      test("difffing unfinished", async () => {
        buildStatusMock.mockReturnValueOnce(
          Promise.resolve({
            status: BuildStatus.Running,
            unapprovedCount: 2,
            errorCount: 0,
          })
        );

        await visualSnapshots.generateAndSendPdfFileSnapshots(
          filename,
          pdfPages,
          params
        );

        assertSuccessfulPdfSnapshotsGeneration(filename, params);
      });

      test("difffing finished", async () => {
        buildStatusMock.mockReturnValueOnce(
          Promise.resolve({
            status: BuildStatus.Approved,
            unapprovedCount: 0,
            errorCount: 0,
          })
        );

        await visualSnapshots.generateAndSendPdfFileSnapshots(
          filename,
          pdfPages,
          params
        );

        assertSuccessfulPdfSnapshotsGeneration(filename, params);
      });
    });

    describe("with params and build-id", () => {
      const filename = "filename.pdf";
      const params = {
        branch: "fake-branch",
        buildName: "fake-build-name",
        defaultBranch: "fake-default-branch",
        project: "fake-project",
        customId: "fake-custom-id",
        buildId: "custom-build-id",
        snapshotName: "custom-snapshot-name-{filename}-{page}",
        suiteName: "custom-suite-name",
        testName: "custom-test-name-{filename}",
      } satisfies CreateVisualSnapshotsParams;

      test("difffing unfinished", async () => {
        buildStatusMock.mockReturnValueOnce(
          Promise.resolve({
            status: BuildStatus.Running,
            unapprovedCount: 2,
            errorCount: 0,
          })
        );

        await visualSnapshots.generateAndSendPdfFileSnapshots(
          filename,
          pdfPages,
          params
        );

        assertSuccessfulPdfSnapshotsGeneration(filename, params);
      });

      test("difffing finished", async () => {
        buildStatusMock.mockReturnValueOnce(
          Promise.resolve({
            status: BuildStatus.Approved,
            unapprovedCount: 0,
            errorCount: 0,
          })
        );

        await visualSnapshots.generateAndSendPdfFileSnapshots(
          filename,
          pdfPages,
          params
        );

        assertSuccessfulPdfSnapshotsGeneration(filename, params);
      });
    });

    test("without params", async () => {
      const filename = "filename.pdf";

      buildStatusMock.mockReturnValueOnce(
        Promise.resolve({
          status: BuildStatus.Unapproved,
          unapprovedCount: 2,
          errorCount: 0,
        })
      );

      const params = {} as CreateVisualSnapshotsParams;
      await visualSnapshots.generateAndSendPdfFileSnapshots(
        filename,
        pdfPages,
        params
      );

      assertSuccessfulPdfSnapshotsGeneration(filename, params);
    });
  });
});
