import { BuildStatus, DiffingMethod, VisualApi } from "@saucelabs/visual";
import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../../src/api/visual-snapshots-api.js";
import { formatString } from "../../src/utils/format.js";
import { PdfFile } from "../../src/app/pdf-file.js";
import path from "path";

class TestPdfFile implements PdfFile {
  constructor(public readonly path: string) {}

  public async *convertPagesToImages(): AsyncGenerator<Buffer> {
    for (let i = 0; i < 2; ++i) {
      yield Buffer.from(`fake-image-buffer-${i}`);
    }
  }
}

describe("VisualSnapshots", () => {
  describe("generateAndSendPdfFileSnapshots", () => {
    const consoleInfoSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    const createBuildMock = jest.fn();
    const uploadSnapshotMock = jest.fn();
    const createSnapshotMock = jest.fn();
    const finishBuildMock = jest.fn();
    const buildStatusMock = jest.fn();
    const visualApiMock = {
      createBuild: createBuildMock,
      uploadSnapshot: uploadSnapshotMock,
      createSnapshot: createSnapshotMock,
      finishBuild: finishBuildMock,
      buildStatus: buildStatusMock,
    } as never as VisualApi;

    const visualSnapshots = new VisualSnapshotsApi(visualApiMock);
    const files = [new TestPdfFile("file1.pdf"), new TestPdfFile("file2.pdf")];

    beforeEach(() => {
      createBuildMock.mockReset();
      createBuildMock.mockResolvedValue({
        id: "build-id",
        url: "http://build-url/build-id",
      });

      let uploadId = 0;
      uploadSnapshotMock.mockReset();
      uploadSnapshotMock.mockImplementation(() =>
        Promise.resolve(`upload-id-${uploadId++}`)
      );

      createSnapshotMock.mockReset();
      finishBuildMock.mockReset();
      buildStatusMock.mockReset();
      consoleInfoSpy.mockReset();
    });

    const assertSuccessfulPdfSnapshotsGeneration = (
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
              filename: path.basename(files[0].path),
              page: 1,
            }),
            uploadId: "upload-id-0",
            suiteName: params.suiteName,
            testName: params.testName
              ? formatString(params.testName, {
                  filename: path.basename(files[0].path),
                })
              : undefined,
          },
        ],
        [
          {
            diffingMethod: DiffingMethod.Balanced,
            buildId: params.buildId ?? "build-id",
            name: formatString(params.snapshotName ?? "page-{page}", {
              filename: path.basename(files[0].path),
              page: 2,
            }),
            uploadId: "upload-id-1",
            suiteName: params.suiteName,
            testName: params.testName
              ? formatString(params.testName, {
                  filename: path.basename(files[0].path),
                })
              : undefined,
          },
        ],
        [
          {
            diffingMethod: DiffingMethod.Balanced,
            buildId: params.buildId ?? "build-id",
            name: formatString(params.snapshotName ?? "page-{page}", {
              filename: path.basename(files[1].path),
              page: 1,
            }),
            uploadId: "upload-id-2",
            suiteName: params.suiteName,
            testName: params.testName
              ? formatString(params.testName, {
                  filename: path.basename(files[1].path),
                })
              : undefined,
          },
        ],
        [
          {
            diffingMethod: DiffingMethod.Balanced,
            buildId: params.buildId ?? "build-id",
            name: formatString(params.snapshotName ?? "page-{page}", {
              filename: path.basename(files[1].path),
              page: 2,
            }),
            uploadId: "upload-id-3",
            suiteName: params.suiteName,
            testName: params.testName
              ? formatString(params.testName, {
                  filename: path.basename(files[1].path),
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
        buildStatusMock.mockResolvedValueOnce({
          status: BuildStatus.Running,
          unapprovedCount: 2,
          errorCount: 0,
        });

        await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

        assertSuccessfulPdfSnapshotsGeneration(params);
      });

      test("difffing finished", async () => {
        buildStatusMock.mockResolvedValueOnce({
          status: BuildStatus.Approved,
          unapprovedCount: 0,
          errorCount: 0,
        });

        await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

        assertSuccessfulPdfSnapshotsGeneration(params);
      });
    });

    describe("with params and build-id", () => {
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
        buildStatusMock.mockResolvedValueOnce({
          status: BuildStatus.Running,
          unapprovedCount: 2,
          errorCount: 0,
        });

        await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

        assertSuccessfulPdfSnapshotsGeneration(params);
      });

      test("difffing finished", async () => {
        buildStatusMock.mockResolvedValueOnce({
          status: BuildStatus.Approved,
          unapprovedCount: 0,
          errorCount: 0,
        });

        await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

        assertSuccessfulPdfSnapshotsGeneration(params);
      });
    });

    test("without params", async () => {
      buildStatusMock.mockResolvedValueOnce({
        status: BuildStatus.Unapproved,
        unapprovedCount: 2,
        errorCount: 0,
      });

      const params = {} as CreateVisualSnapshotsParams;
      await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

      assertSuccessfulPdfSnapshotsGeneration(params);
    });
  });
});
