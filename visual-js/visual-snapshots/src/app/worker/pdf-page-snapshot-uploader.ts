import path from "path";
import { formatString } from "../../utils/format.js";
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
    suiteName: string | undefined,
    testNameFormat: string | undefined,
    snapshotNameFormat: string | undefined
  ) {
    const pdfFile = await this.pdfFileLoader.loadPdfFile(pdfFilePath);
    const page = await pdfFile.getPage(pageNumber);

    const filename = path.basename(pdfFile.path);
    const testName = testNameFormat
      ? formatString(testNameFormat, { filename })
      : undefined;

    const snapshotFormat = this.getSnapshotFormat(snapshotNameFormat);
    const snapshotName = formatString(snapshotFormat, {
      filename,
      page: pageNumber,
    });

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

  private getSnapshotFormat(format: string | undefined) {
    if (!format) {
      return `page-{page}`;
    }

    // Page number is always required to make the snapshot names unique
    if (!format.includes("{page}")) {
      format = format += "-{page}";
    }

    return format;
  }
}
