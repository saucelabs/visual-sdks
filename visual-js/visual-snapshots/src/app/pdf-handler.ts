import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../api/visual-snapshots-api.js";
import { initializeVisualApi } from "../api/visual-client.js";
import { LibPdfFileLoader } from "./pdf-file-loader.js";
import { VisualConfig } from "@saucelabs/visual";
import { getFiles } from "../utils/glob.js";
import { WorkerPoolPdfSnapshotUploader } from "./worker/worker-pool-pdf-snapshot-uploader.js";

export interface PdfCommandParams
  extends VisualConfig,
    CreateVisualSnapshotsParams {
  concurrency: number;
}

export class PdfCommandHandler {
  constructor(private readonly clientVersion: string) {}

  public async handle(globsOrDirs: string[], params: PdfCommandParams) {
    const visualApi = initializeVisualApi(params, this.clientVersion);
    const visualSnapshots = new VisualSnapshotsApi(visualApi);
    const pdfSnapshotUploader = new WorkerPoolPdfSnapshotUploader(
      new LibPdfFileLoader(),
      {
        maxWorkers: params.concurrency,
      }
    );

    const pdfFilePaths = await getFiles(globsOrDirs, "*.pdf");

    const buildId =
      params.buildId ?? (await visualSnapshots.createBuild(params));

    await pdfSnapshotUploader.uploadSnapshots({
      buildId,
      pdfFilePaths,
      suiteName: params.suiteName,
      testNameFormat: params.testName,
      snapshotNameFormat: params.snapshotName,
    });

    if (!params.buildId) {
      await visualSnapshots.finishBuild(buildId);
    }
  }
}
