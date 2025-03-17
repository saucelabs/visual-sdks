import path from "path";
import { formatString } from "../../utils/format.js";
import { DiffingMethod, VisualApi } from "@saucelabs/visual";
import { PdfFileLoader } from "../../app/pdf-file-loader.js";

export class PdfPageSnapshotUploader {
  constructor(
    private readonly api: VisualApi,
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

    await this.uploadImageAndCreateSnapshot(
      filename,
      pageNumber,
      page,
      buildId,
      snapshotName,
      testName,
      suiteName
    );
  }

  private async uploadImageAndCreateSnapshot(
    file: string,
    pageNumber: number,
    snapshot: Buffer,
    buildId: string,
    snapshotName: string,
    testName?: string,
    suiteName?: string
  ) {
    const uploadId = await this.api.uploadSnapshot({
      buildId,
      image: { data: snapshot },
    });

    console.info(
      `[${file}:${pageNumber}] Uploaded image to build ${buildId}: upload id=${uploadId}.`
    );

    await this.api.createSnapshot({
      buildId,
      uploadId,
      name: snapshotName,
      diffingMethod: DiffingMethod.Balanced,
      testName,
      suiteName,
    });

    console.info(
      `[${file}:${pageNumber}] Created a snapshot ${snapshotName} for build ${buildId}.`
    );
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
