import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../api/visual-snapshots-api.js";
import { VisualConfig } from "@saucelabs/visual";
import { getFiles } from "../utils/glob.js";
import { PdfSnapshotUploader } from "./pdf-files-snapshot-uploader.js";

export interface PdfCommandParams
  extends VisualConfig,
    CreateVisualSnapshotsParams {
  concurrency: number;
}

export class PdfCommandHandler {
  constructor(
    private readonly visualSnapshotsApi: VisualSnapshotsApi,
    private readonly pdfSnapshotUploader: PdfSnapshotUploader
  ) {}

  public async handle(
    globsOrDirs: string[],
    params: PdfCommandParams
  ): Promise<void> {
    const pdfFilePaths = await getFiles(globsOrDirs, "*.pdf");

    const buildId =
      params.buildId ?? (await this.visualSnapshotsApi.createBuild(params));

    try {
      await this.pdfSnapshotUploader.uploadSnapshots({
        buildId,
        pdfFilePaths,
        suiteName: params.suiteName,
        testNameFormat: params.testName,
        snapshotNameFormat: params.snapshotName,
      });
    } finally {
      if (!params.buildId) {
        await this.visualSnapshotsApi.finishBuild(buildId);
      }
    }
  }
}
