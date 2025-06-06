import { VisualSnapshotsApi } from "../../src/api/visual-snapshots-api.js";
import { PdfSnapshotUploader } from "../../src/app/pdf-files-snapshot-uploader.js";
import {
  PdfCommandHandler,
  PdfCommandParams,
} from "../../src/app/pdf-handler.js";
import { MockFileExtractor } from "../mock-file-extractor.js";
import { mockLogger } from "../mock-logger.js";
import { __dirname } from "../system-helpers.js";
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

  const suiteName = "suiteName";
  const testName = "testName";
  const snapshotName = "snapshotName";
  const buildId = "buildId";

  const mockFileExtractor = new MockFileExtractor();

  const { logger, logged, reset: resetLogger } = mockLogger();

  beforeEach(() => {
    jest.resetAllMocks();
    resetLogger();
    mockFileExtractor.reset();
  });

  describe("creating build", () => {
    it("should create a build when buildId is not passed", async () => {
      mockFileExtractor.setFilesToReturn([
        "/absolute/path/to/files/1.pdf",
        "/absolute/path/to/files/2.pdf",
      ]);

      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock,
        mockFileExtractor,
        logger
      );

      const params: PdfCommandParams = {
        suiteName,
        testName,
        snapshotName,
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/")],
        params
      );

      expect(createBuildMock).toHaveBeenCalledWith(params);
      expect(mockFileExtractor.calls()).toEqual([
        {
          globOrDirs: [path.join(__dirname(import.meta), "../files/")],
          dirGlob: "*.pdf",
        },
      ]);
      expect(logged).toMatchSnapshot();
    });

    it("should not create a build when buildId is passed", async () => {
      mockFileExtractor.setFilesToReturn(["/absolute/path/to/files/1.pdf"]);

      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock,
        mockFileExtractor,
        logger
      );

      const params: PdfCommandParams = {
        suiteName,
        testName,
        snapshotName,
        buildId,
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(createBuildMock).not.toHaveBeenCalled();
      expect(mockFileExtractor.calls()).toEqual([
        {
          globOrDirs: [path.join(__dirname(import.meta), "../files/1.pdf")],
          dirGlob: "*.pdf",
        },
      ]);
      expect(logged).toMatchSnapshot();
    });

    it("should not create a build when there are no files to process", async () => {
      mockFileExtractor.setFilesToReturn([]);

      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock,
        mockFileExtractor,
        logger
      );

      const params: PdfCommandParams = {
        suiteName,
        testName,
        snapshotName,
        buildId,
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(createBuildMock).not.toHaveBeenCalled();
      expect(mockFileExtractor.calls()).toEqual([
        {
          globOrDirs: [path.join(__dirname(import.meta), "../files/1.pdf")],
          dirGlob: "*.pdf",
        },
      ]);
      expect(logged).toMatchSnapshot();
    });
  });

  describe("uploading snapshots", () => {
    it("should call uploadSnapshots with created build ID", async () => {
      mockFileExtractor.setFilesToReturn(["/absolute/path/to/files/1.pdf"]);

      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock,
        mockFileExtractor,
        logger
      );

      const params: PdfCommandParams = {
        suiteName,
        testName,
        snapshotName,
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
          suiteNameFormat: suiteName,
          testNameFormat: testName,
          snapshotNameFormat: snapshotName,
        })
      );
    });

    it("should call uploadSnapshots with provided build ID", async () => {
      mockFileExtractor.setFilesToReturn(["/absolute/path/to/files/1.pdf"]);

      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock,
        mockFileExtractor,
        logger
      );

      const params: PdfCommandParams = {
        buildId,
        suiteName,
        testName,
        snapshotName,
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(uploadSnapshotsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          buildId,
          suiteNameFormat: suiteName,
          testNameFormat: testName,
          snapshotNameFormat: snapshotName,
        })
      );
    });
  });

  describe("finishing build", () => {
    it("should finish build when buildId is not passed, using created build ID", async () => {
      createBuildMock.mockResolvedValue(buildId);

      mockFileExtractor.setFilesToReturn(["/absolute/path/to/files/1.pdf"]);

      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock,
        mockFileExtractor,
        logger
      );

      const params: PdfCommandParams = {
        suiteName,
        testName,
        snapshotName,
        concurrency: 1,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(finishBuildMock).toHaveBeenCalledWith({ buildId });
    });

    it("should not finish build when buildId is passed", async () => {
      mockFileExtractor.setFilesToReturn(["/absolute/path/to/files/1.pdf"]);

      const handler = new PdfCommandHandler(
        visualSnapshotsApi,
        pdfSnapshotUploaderMock,
        mockFileExtractor,
        logger
      );

      const params: PdfCommandParams = {
        concurrency: 1,
        suiteName,
        testName,
        snapshotName,
        buildId,
      };

      await handler.handle(
        [path.join(__dirname(import.meta), "../files/1.pdf")],
        params
      );

      expect(finishBuildMock).not.toHaveBeenCalled();
    });
  });
});
