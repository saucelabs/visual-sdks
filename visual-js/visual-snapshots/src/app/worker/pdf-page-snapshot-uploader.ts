import {
  buildFileMetadata,
  formatStringWithFileMetadata,
} from "../../utils/templates.js";
import { PdfFileLoader } from "../pdf-file-loader.js";
import { VisualSnapshotsApi } from "../../api/visual-snapshots-api.js";
import { logger as defaultLogger } from "../../logger.js";

export class PdfPageSnapshotUploader {
  constructor(
    private readonly visualSnapshotsApi: VisualSnapshotsApi,
    private readonly pdfFileLoader: PdfFileLoader
  ) {}

  public async uploadPageSnapshot(
    buildId: string,
    pdfFilePath: string,
    pageNumber: number,
    suiteNameFormat: string,
    testNameFormat: string,
    snapshotNameFormat: string
  ) {
    const pdfFile = await this.pdfFileLoader.loadPdfFile(pdfFilePath);
    const page = await pdfFile.getPage(pageNumber);

    const pdfFileMetadata = buildFileMetadata(pdfFilePath, pageNumber);
    const testName = formatStringWithFileMetadata(
      testNameFormat,
      pdfFileMetadata
    );
    const snapshotName = formatStringWithFileMetadata(
      snapshotNameFormat,
      pdfFileMetadata
    );
    const suiteName = formatStringWithFileMetadata(
      suiteNameFormat,
      pdfFileMetadata
    );

    const logger = defaultLogger.child({
      filePath: pdfFilePath,
      pageNumber,
      snapshotName,
      suiteName,
      testName,
    });

    return await this.visualSnapshotsApi.uploadImageAndCreateSnapshot({
      buildId,
      snapshot: page,
      snapshotName,
      suiteName,
      testName,
      logger,
    });
  }
}
