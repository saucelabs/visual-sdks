import { BuildStatus, VisualApi } from "@saucelabs/visual";
import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../../src/api/visual-snapshots-api.js";
import {
  PdfSnapshotUploader,
  UploadPdfSnapshotsParams,
} from "../../src/api/pdf-files-snapshot-uploader.js";

describe("VisualSnapshots", () => {
  describe("generateAndSendPdfFileSnapshots", () => {
    const consoleInfoSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    const uploadSnapshotsMock = jest
      .fn<
        ReturnType<PdfSnapshotUploader["uploadSnapshots"]>,
        Parameters<PdfSnapshotUploader["uploadSnapshots"]>
      >()
      .mockResolvedValue(Promise.resolve());

    const pdfFilesSnapshotUploaderMock: PdfSnapshotUploader = {
      uploadSnapshots: uploadSnapshotsMock,
    };

    const createBuildMock = jest.fn<
      ReturnType<VisualApi["createBuild"]>,
      Parameters<VisualApi["createBuild"]>
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
      finishBuild: finishBuildMock,
      buildStatus: buildStatusMock,
    } as never as VisualApi;

    const visualSnapshots = new VisualSnapshotsApi(
      visualApiMock,
      pdfFilesSnapshotUploaderMock
    );

    const files = ["file1.pdf", "file2.pdf"];

    beforeEach(() => {
      createBuildMock.mockReset();
      createBuildMock.mockResolvedValue({
        id: "build-id",
        url: "http://build-url/build-id",
      } as never);

      uploadSnapshotsMock.mockReset();
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
      pdfFilePaths: string[],
      params: CreateVisualSnapshotsParams
    ) {
      expect(uploadSnapshotsMock).toHaveBeenCalledWith({
        buildId: params.buildId ?? "build-id",
        pdfFilePaths,
        suiteName: params.suiteName,
        testNameFormat: params.testName,
        snapshotNameFormat: params.snapshotName,
      } satisfies UploadPdfSnapshotsParams);
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
