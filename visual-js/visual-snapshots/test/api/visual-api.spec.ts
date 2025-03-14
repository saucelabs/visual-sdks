import { BuildStatus, DiffingMethod, VisualApi } from "@saucelabs/visual";
import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../../src/api/visual-snapshots-api.js";
import { formatString } from "../../src/utils/format.js";
import { PdfFile } from "../../src/app/pdf-file.js";
import path from "path";

class TestPdfFile implements PdfFile {
  constructor(public readonly path: string, public readonly pages: number) {}

  public async *convertPagesToImages(): AsyncGenerator<Buffer> {
    for (let i = 0; i < this.pages; ++i) {
      yield Buffer.from(createFakeBuffer(this.path, i + 1));
    }
  }
}

function createFakeBuffer(path: string, page: number) {
  return `path:${path};page:${page}`;
}

function createUploadId(content: string) {
  return `upload-id:${content}`;
}

describe("VisualSnapshots", () => {
  describe("generateAndSendPdfFileSnapshots", () => {
    const consoleInfoSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    const createBuildMock = jest.fn<
      ReturnType<VisualApi["createBuild"]>,
      Parameters<VisualApi["createBuild"]>
    >();
    const uploadSnapshotMock = jest.fn<
      ReturnType<VisualApi["uploadSnapshot"]>,
      Parameters<VisualApi["uploadSnapshot"]>
    >();
    const createSnapshotMock = jest.fn<
      ReturnType<VisualApi["createSnapshot"]>,
      Parameters<VisualApi["createSnapshot"]>
    >();
    const finishBuildMock = jest.fn<
      ReturnType<VisualApi["finishBuild"]>,
      Parameters<VisualApi["finishBuild"]>
    >();
    const buildStatusMock = jest.fn<
      ReturnType<VisualApi["buildStatus"]>,
      Parameters<VisualApi["buildStatus"]>
    >();
    const visualApiMock = {
      createBuild: createBuildMock,
      uploadSnapshot: uploadSnapshotMock,
      createSnapshot: createSnapshotMock,
      finishBuild: finishBuildMock,
      buildStatus: buildStatusMock,
    } as never as VisualApi;

    const visualSnapshots = new VisualSnapshotsApi(visualApiMock);
    const files = [
      new TestPdfFile("file1.pdf", 2),
      new TestPdfFile("file2.pdf", 3),
    ];

    beforeEach(() => {
      createBuildMock.mockReset();
      createBuildMock.mockResolvedValue({
        id: "build-id",
        url: "http://build-url/build-id",
      } as never);

      uploadSnapshotMock.mockReset();
      uploadSnapshotMock.mockImplementation(({ image }) =>
        image && "data" in image
          ? Promise.resolve(createUploadId(image.data.toString("utf-8")))
          : Promise.reject(new Error("image data is missing"))
      );

      createSnapshotMock.mockReset();
      finishBuildMock.mockReset();
      buildStatusMock.mockReset();
      consoleInfoSpy.mockReset();
    });

    function assertBuild(params: CreateVisualSnapshotsParams) {
      if (!params.buildId) {
        expect(createBuildMock).toHaveBeenCalledWith({
          name: params.buildName,
          branch: params.branch,
          defaultBranch: params.defaultBranch,
          project: params.project,
          customId: params.customId,
        });
      } else {
        expect(createBuildMock).not.toHaveBeenCalled();
      }

      expect(finishBuildMock).toHaveBeenCalledWith({
        uuid: params.buildId ?? "build-id",
      });

      expect(buildStatusMock).toHaveBeenCalledWith(
        params.buildId ?? "build-id"
      );
    }

    async function assertSnapshot(
      files: TestPdfFile[],
      params: CreateVisualSnapshotsParams
    ) {
      for (const file of files) {
        let i = 0;
        for await (const page of file.convertPagesToImages()) {
          const pageNumber = i + 1;
          expect(uploadSnapshotMock).toHaveBeenCalledWith({
            buildId: params.buildId ?? "build-id",
            image: { data: page },
          });

          expect(createSnapshotMock).toHaveBeenCalledWith({
            diffingMethod: DiffingMethod.Balanced,
            buildId: params.buildId ?? "build-id",
            name: formatString(params.snapshotName ?? "page-{page}", {
              filename: path.basename(file.path),
              page: pageNumber,
            }),
            uploadId: createUploadId(createFakeBuffer(file.path, pageNumber)),
            suiteName: params.suiteName,
            testName: params.testName
              ? formatString(params.testName, {
                  filename: path.basename(file.path),
                })
              : undefined,
          });

          i++;
        }
      }
    }

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
        concurrency: 1,
      } satisfies CreateVisualSnapshotsParams;

      test("difffing unfinished", async () => {
        buildStatusMock.mockResolvedValueOnce({
          status: BuildStatus.Running,
          unapprovedCount: 2,
          errorCount: 0,
          url: "",
        });

        await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

        assertBuild(params);
        await assertSnapshot(files, params);

        expect(consoleInfoSpy.mock.calls).toMatchSnapshot();
      });

      test("difffing finished", async () => {
        buildStatusMock.mockResolvedValueOnce({
          status: BuildStatus.Approved,
          unapprovedCount: 0,
          errorCount: 0,
          url: "",
        });

        await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

        assertBuild(params);
        await assertSnapshot(files, params);

        expect(consoleInfoSpy.mock.calls).toMatchSnapshot();
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
        concurrency: 1,
      } satisfies CreateVisualSnapshotsParams;

      test("difffing unfinished", async () => {
        buildStatusMock.mockResolvedValueOnce({
          status: BuildStatus.Running,
          unapprovedCount: 2,
          errorCount: 0,
          url: "",
        });

        await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

        assertBuild(params);
        await assertSnapshot(files, params);

        expect(consoleInfoSpy.mock.calls).toMatchSnapshot();
      });

      test("difffing finished", async () => {
        buildStatusMock.mockResolvedValueOnce({
          status: BuildStatus.Approved,
          unapprovedCount: 0,
          errorCount: 0,
          url: "",
        });

        await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

        assertBuild(params);
        await assertSnapshot(files, params);

        expect(consoleInfoSpy.mock.calls).toMatchSnapshot();
      });
    });

    test("without params", async () => {
      buildStatusMock.mockResolvedValueOnce({
        status: BuildStatus.Unapproved,
        unapprovedCount: 2,
        errorCount: 0,
        url: "",
      });

      const params = {} as CreateVisualSnapshotsParams;
      await visualSnapshots.generateAndSendPdfFileSnapshots(files, params);

      assertBuild(params);
      await assertSnapshot(files, params);

      expect(consoleInfoSpy.mock.calls).toMatchSnapshot();
    });
  });
});
