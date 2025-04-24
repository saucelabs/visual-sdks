import {
  buildFileMetadata,
  formatStringWithFileMetadata,
} from "../../utils/format.js";
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
    suiteNameFormat: string | undefined,
    testNameFormat: string | undefined,
    snapshotNameFormat: string | undefined
  ) {
    const pdfFile = await this.pdfFileLoader.loadPdfFile(pdfFilePath);
    const page = await pdfFile.getPage(pageNumber);

    const pdfFileMetadata = buildFileMetadata(pdfFilePath, pageNumber);
    const testName = testNameFormat
      ? formatStringWithFileMetadata(testNameFormat, pdfFileMetadata)
      : undefined;
    const snapshotName = formatStringWithFileMetadata(
      snapshotNameFormat ? snapshotNameFormat : `page-{page}`,
      pdfFileMetadata
    );
    const suiteName = suiteNameFormat
      ? formatStringWithFileMetadata(suiteNameFormat, pdfFileMetadata)
      : undefined;

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
