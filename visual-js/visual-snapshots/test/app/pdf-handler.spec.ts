import { VisualSnapshotsApi } from "../../src/api/visual-snapshots-api.js";
import { PdfSnapshotUploader } from "../../src/app/pdf-files-snapshot-uploader.js";
import {
  PdfCommandHandler,
  PdfCommandParams,
} from "../../src/app/pdf-handler.js";
import { __dirname } from "../helpers.js";
import path from "path";

describe("pdf-handler", () => {
  const createBuildMock = jest.fn<
    ReturnType<VisualSnapshotsApi["createBuild"]>,
    Parameters<VisualSnapshotsApi["createBuild"]>
  >();
  const finishBuildMock = jest.fn<
    ReturnType<VisualSnapshotsApi["finishBuild"]>,
    Parameters<VisualSnapshotsApi["finishBuild"]>
  >();

  const visualSnapshotsApi = {
    createBuild: createBuildMock,
    finishBuild: finishBuildMock,
  } as never as VisualSnapshotsApi;

  const uploadSnapshotsMock = jest.fn<
    ReturnType<PdfSnapshotUploader["uploadSnapshots"]>,
    Parameters<PdfSnapshotUploader["uploadSnapshots"]>
  >();

  const pdfSnapshotUploaderMock = {
    uploadSnapshots: uploadSnapshotsMock,
  } as never as PdfSnapshotUploader;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("creating build", () => {
    it("should create a build when buildId is not passed", async () => {
      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock
      );

      const params: PdfCommandParams = {
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(createBuildMock).toHaveBeenCalledWith(params);
    });

    it("should not create a build when buildId is passed", async () => {
      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock
      );

      const params: PdfCommandParams = {
        buildId: "buildId",
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(createBuildMock).not.toHaveBeenCalled();
    });
  });

  describe("uploading snapshots", () => {
    it("should call uploadSnapshots with created build ID", async () => {
      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock
      );

      const buildId = "buildId";

      const params: PdfCommandParams = {
        concurrency: 1,
      };

      createBuildMock.mockResolvedValue(buildId);

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(uploadSnapshotsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          buildId,
        })
      );
    });

    it("should call uploadSnapshots with provided build ID", async () => {
      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock
      );

      const buildId = "buildId";

      const params: PdfCommandParams = {
        buildId,
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(uploadSnapshotsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          buildId,
        })
      );
    });
  });

  describe("finishing build", () => {
    it("should finish build when buildId is not passed, using created build ID", async () => {
      const buildId = "buildId";
      createBuildMock.mockResolvedValue(buildId);

      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock
      );

      const params: PdfCommandParams = {
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(finishBuildMock).toHaveBeenCalledWith({ buildId });
    });

    it("should not finish build when buildId is passed", async () => {
      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock
      );

      const params: PdfCommandParams = {
        concurrency: 1,
        buildId: "buildId",
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(finishBuildMock).not.toHaveBeenCalled();
    });
  });
});
