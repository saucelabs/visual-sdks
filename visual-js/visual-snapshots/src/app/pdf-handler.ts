import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../api/visual-snapshots-api.js";
import { VisualConfig } from "@saucelabs/visual";
import { PdfSnapshotUploader } from "./pdf-files-snapshot-uploader.js";
import { logger as defaultLogger } from "../logger.js";
import { FileExtractor } from "../utils/glob.js";
import { Logger } from "pino";

export interface PdfCommandParams
  extends VisualConfig,
    CreateVisualSnapshotsParams {
  concurrency: number;
}

export class PdfCommandHandler {
  constructor(
    private readonly visualSnapshotsApi: VisualSnapshotsApi,
    private readonly pdfSnapshotUploader: PdfSnapshotUploader,
    private readonly fileExtractor: FileExtractor,
    private readonly logger: Logger = defaultLogger
  ) {}

  public async handle(
    globsOrDirs: string[],
    params: PdfCommandParams
  ): Promise<void> {
    const pdfFilePaths = await this.fileExtractor.getFiles(
      globsOrDirs,
      "*.pdf"
    );

    if (pdfFilePaths.length === 0) {
      this.logger.warn("No PDF files found to process.");
      return;
    }

    this.logger.info(
      {
        count: pdfFilePaths.length,
        paths: pdfFilePaths,
      },
      `Found PDF file${pdfFilePaths.length > 1 ? "s" : ""} to process`
    );

    const buildId =
      params.buildId ?? (await this.visualSnapshotsApi.createBuild(params));

    try {
      await this.pdfSnapshotUploader.uploadSnapshots({
        buildId,
        pdfFilePaths,
        suiteNameFormat: params.suiteName,
        testNameFormat: params.testName,
        snapshotNameFormat: params.snapshotName,
      });
    } finally {
      if (!params.buildId) {
        await this.visualSnapshotsApi.finishBuild({ buildId });
      }
    }
  }
}
