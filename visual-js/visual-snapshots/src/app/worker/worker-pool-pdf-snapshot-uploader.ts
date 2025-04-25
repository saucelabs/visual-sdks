import path from "path";
import workerpool, { WorkerPoolOptions } from "workerpool";
import {
  PdfSnapshotUploader as PdfSnapshotUploader,
  UploadPdfSnapshotsParams,
} from "../../app/pdf-files-snapshot-uploader.js";
import { execAll } from "../../utils/pool.js";
import { PdfFileLoader } from "../../app/pdf-file-loader.js";
import { ProcessPdfPageMethod } from "./worker.js";
import { __dirname } from "../../utils/helpers.js";

export class WorkerPoolPdfSnapshotUploader implements PdfSnapshotUploader {
  constructor(
    private readonly pdfLoader: PdfFileLoader,
    private readonly poolOptions?: WorkerPoolOptions
  ) {}

  public async uploadSnapshots({
    buildId,
    pdfFilePaths,
    suiteNameFormat,
    testNameFormat,
    snapshotNameFormat,
  }: UploadPdfSnapshotsParams): Promise<void> {
    const pool = this.createPool();
    try {
      await execAll<ProcessPdfPageMethod>(
        pool,
        this.processPageCalls(
          buildId,
          pdfFilePaths,
          suiteNameFormat,
          testNameFormat,
          snapshotNameFormat
        )
      );
    } finally {
      pool.terminate();
    }
  }

  private createPool() {
    return workerpool.pool(path.join(__dirname(import.meta), "./worker.js"), {
      workerThreadOpts: {
        argv: process.argv,
      },
      ...this.poolOptions,
    });
  }

  private async *processPageCalls(
    buildId: string,
    pdfFilePaths: string[],
    suiteNameFormat: string,
    testNameFormat: string,
    snapshotNameFormat: string
  ): AsyncGenerator<ProcessPdfPageMethod> {
    for (const pdfFilePath of pdfFilePaths) {
      const loaded = await this.pdfLoader.loadPdfFile(pdfFilePath);
      for (let i = 0; i < loaded.pages; i++) {
        yield {
          method: "processPdfPage",
          args: [
            buildId,
            pdfFilePath,
            i + 1,
            suiteNameFormat,
            testNameFormat,
            snapshotNameFormat,
          ],
        };
      }
    }
  }
}
