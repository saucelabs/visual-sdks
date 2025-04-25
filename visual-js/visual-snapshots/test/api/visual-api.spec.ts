import { BuildStatus, DiffingMethod, VisualApi } from "@saucelabs/visual";
import {
  CreateBuildParams,
  UploadSnapshotParams,
  VisualSnapshotsApi,
} from "../../src/api/visual-snapshots-api.js";
import { mockLogger } from "../mock-logger.js";

describe("VisualSnapshots", () => {
  const { logger, logged, reset: resetLogger } = mockLogger();

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
  const uploadSnapshotMock = jest.fn<
    ReturnType<VisualApi["uploadSnapshot"]>,
    Parameters<VisualApi["uploadSnapshot"]>
  >();
  const createSnapshotMock = jest.fn<
    ReturnType<VisualApi["createSnapshot"]>,
    Parameters<VisualApi["createSnapshot"]>
  >();
  const visualApi = {
    createBuild: createBuildMock,
    finishBuild: finishBuildMock,
    buildStatus: buildStatusMock,
    uploadSnapshot: uploadSnapshotMock,
    createSnapshot: createSnapshotMock,
  } as never as VisualApi;

  beforeEach(() => {
    createBuildMock.mockReset();
    finishBuildMock.mockReset();
    buildStatusMock.mockReset();
    resetLogger();
  });

  describe("createBuild", () => {
    it("should execute createBuild API with passed params", async () => {
      const buildId = "foo";

      createBuildMock.mockResolvedValue({
        id: buildId,
      } as never);

      const api = new VisualSnapshotsApi(visualApi);

      const params: CreateBuildParams = {
        buildName: "testBuildName",
        branch: "testBranch",
        defaultBranch: "testDefaultBranch",
        project: "testProject",
        customId: "testCustomId",
        logger,
      };

      await api.createBuild(params);

      expect(createBuildMock).toHaveBeenCalledWith({
        name: params.buildName,
        branch: params.branch,
        defaultBranch: params.defaultBranch,
        project: params.project,
        customId: params.customId,
      });
    });

    it("should return build id from createBuild API", async () => {
      const buildId = "foo";

      createBuildMock.mockResolvedValue({
        id: buildId,
      } as never);

      const api = new VisualSnapshotsApi(visualApi);

      const actual = await api.createBuild({ logger });

      expect(actual).toEqual(buildId);
    });

    test("log output", async () => {
      const buildId = "foo";

      createBuildMock.mockResolvedValue({
        id: buildId,
      } as never);

      const api = new VisualSnapshotsApi(visualApi);

      await api.createBuild({ logger });

      expect(logged).toMatchSnapshot();
    });
  });

  describe("finishBuild", () => {
    it("should execute finishBuild API with passed buildId", async () => {
      const buildId = "buildId";
      finishBuildMock.mockResolvedValue({
        buildId,
        status: BuildStatus.Equal,
      } as never);
      buildStatusMock.mockResolvedValue({
        status: BuildStatus.Equal,
        errorCount: 0,
        unapprovedCount: 0,
        url: "",
      });

      const api = new VisualSnapshotsApi(visualApi);

      await api.finishBuild({ buildId, logger });

      expect(finishBuildMock).toHaveBeenCalledWith({
        uuid: buildId,
      });
    });

    it("should call buildStatus API with passed buildId when build status resolves to other than Running or Queued", async () => {
      const buildId = "buildId";
      finishBuildMock.mockResolvedValue({
        buildId,
        status: BuildStatus.Equal,
      } as never);
      buildStatusMock.mockResolvedValue({
        status: BuildStatus.Equal,
        errorCount: 0,
        unapprovedCount: 0,
        url: "",
      });

      const visualApi = {
        finishBuild: finishBuildMock,
        buildStatus: buildStatusMock,
      } as unknown as VisualApi;

      const api = new VisualSnapshotsApi(visualApi);

      await api.finishBuild({ buildId, logger });

      expect(buildStatusMock).toHaveBeenCalledWith(buildId);
    });

    it("should not call buildStatus API when build status resolves to Running", async () => {
      const buildId = "buildId";
      finishBuildMock.mockResolvedValue({
        buildId,
        status: BuildStatus.Running,
      } as never);
      buildStatusMock.mockResolvedValue({
        status: BuildStatus.Running,
        errorCount: 0,
        unapprovedCount: 0,
        url: "",
      });

      const api = new VisualSnapshotsApi(visualApi);

      await api.finishBuild({ buildId, logger });

      expect(buildStatusMock).not.toHaveBeenCalled();
    });

    it("should not call buildStatus API when build status resolves to Queued", async () => {
      const buildId = "buildId";
      finishBuildMock.mockResolvedValue({
        buildId,
        status: BuildStatus.Queued,
      } as never);
      buildStatusMock.mockResolvedValue({
        status: BuildStatus.Queued,
        errorCount: 0,
        unapprovedCount: 0,
        url: "",
      });
      const api = new VisualSnapshotsApi(visualApi);

      await api.finishBuild({ buildId, logger });

      expect(buildStatusMock).not.toHaveBeenCalled();
    });

    test("log output when build status resolves to Equal", async () => {
      const buildId = "buildId";
      finishBuildMock.mockResolvedValue({
        buildId,
        status: BuildStatus.Equal,
      } as never);
      buildStatusMock.mockResolvedValue({
        status: BuildStatus.Equal,
        errorCount: 1,
        unapprovedCount: 2,
        url: "",
      });

      const api = new VisualSnapshotsApi(visualApi);

      await api.finishBuild({ buildId, logger });

      expect(logged).toMatchSnapshot();
    });

    test("log output when build status resolves to Running", async () => {
      const buildId = "buildId";
      finishBuildMock.mockResolvedValue({
        buildId,
        status: BuildStatus.Running,
      } as never);
      buildStatusMock.mockResolvedValue({
        status: BuildStatus.Running,
        errorCount: 0,
        unapprovedCount: 0,
        url: "",
      });

      const api = new VisualSnapshotsApi(visualApi);

      await api.finishBuild({ buildId, logger });

      expect(logged).toMatchSnapshot();
    });

    test("log output when build status resolves to Queued", async () => {
      const buildId = "buildId";
      finishBuildMock.mockResolvedValue({
        buildId,
        status: BuildStatus.Queued,
      } as never);
      buildStatusMock.mockResolvedValue({
        status: BuildStatus.Queued,
        errorCount: 0,
        unapprovedCount: 0,
        url: "",
      });

      const api = new VisualSnapshotsApi(visualApi);

      await api.finishBuild({ buildId, logger });

      expect(logged).toMatchSnapshot();
    });
  });

  describe("uploadImageAndCreateSnapshot", () => {
    it("should call uploadSnapshot API", async () => {
      const uploadId = "uploadId";
      uploadSnapshotMock.mockResolvedValue(uploadId);

      const api = new VisualSnapshotsApi(visualApi);

      const params: UploadSnapshotParams = {
        buildId: "testBuildId",
        snapshot: Buffer.from("snapshot"),
        snapshotName: "testSnapshotName",
        suiteName: "testSuiteName",
        testName: "testTestName",
        logger,
      };

      await api.uploadImageAndCreateSnapshot(params);

      expect(uploadSnapshotMock).toHaveBeenCalledWith({
        buildId: params.buildId,
        image: { data: params.snapshot },
      });
    });

    it("should call createSnapshot API", async () => {
      const uploadId = "uploadId";
      uploadSnapshotMock.mockResolvedValue(uploadId);

      const api = new VisualSnapshotsApi(visualApi);

      const params: UploadSnapshotParams = {
        buildId: "testBuildId",
        snapshot: Buffer.from("snapshot"),
        snapshotName: "testSnapshotName",
        suiteName: "testSuiteName",
        testName: "testTestName",
        logger,
      };

      await api.uploadImageAndCreateSnapshot(params);

      expect(createSnapshotMock).toHaveBeenCalledWith({
        buildId: params.buildId,
        uploadId,
        name: params.snapshotName,
        diffingMethod: DiffingMethod.Balanced,
        testName: params.testName,
        suiteName: params.suiteName,
      });
    });

    it("should return uploadId from uploadSnapshot API", async () => {
      const uploadId = "uploadId";
      uploadSnapshotMock.mockResolvedValue(uploadId);

      const api = new VisualSnapshotsApi(visualApi);

      const params: UploadSnapshotParams = {
        buildId: "testBuildId",
        snapshot: Buffer.from("snapshot"),
        snapshotName: "testSnapshotName",
        suiteName: "testSuiteName",
        testName: "testTestName",
        logger,
      };

      const actual = await api.uploadImageAndCreateSnapshot(params);
      expect(actual).toEqual(uploadId);
    });

    test("log output", async () => {
      const uploadId = "uploadId";
      uploadSnapshotMock.mockResolvedValue(uploadId);

      const api = new VisualSnapshotsApi(visualApi);

      const params: UploadSnapshotParams = {
        buildId: "testBuildId",
        snapshot: Buffer.from("snapshot"),
        snapshotName: "testSnapshotName",
        suiteName: "testSuiteName",
        testName: "testTestName",
        logger,
      };

      await api.uploadImageAndCreateSnapshot(params);

      expect(logged).toMatchSnapshot();
    });
  });
});
