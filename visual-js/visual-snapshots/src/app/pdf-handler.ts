import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../api/visual-snapshots-api.js";
import { initializeVisualApi } from "../api/visual-client.js";
import { LibPdfFileLoader } from "./pdf-file-loader.js";
import { VisualConfig } from "@saucelabs/visual";
import { getFiles } from "../utils/glob.js";
import { WorkerPoolPdfSnapshotUploader } from "../api/worker/worker-pool-pdf-snapshot-uploader.js";

export interface PdfCommandParams
  extends VisualConfig,
    CreateVisualSnapshotsParams {
  concurrency: number;
}

export class PdfCommandHandler {
  private clientVersion: string;

  constructor(clientVersion: string) {
    this.clientVersion = clientVersion;
  }

  public async handle(globsOrDirs: string[], params: PdfCommandParams) {
    const visualApi = initializeVisualApi(params, this.clientVersion);
    const visualSnapshots = new VisualSnapshotsApi(
      visualApi,
      new WorkerPoolPdfSnapshotUploader(new LibPdfFileLoader(), {
        maxWorkers: params.concurrency,
      })
    );

    const pdfFilePaths = await getFiles(globsOrDirs, "*.pdf");
    await visualSnapshots.generateAndSendPdfFileSnapshots(pdfFilePaths, params);
  }
}
