import { BuildStatus, DiffingMethod, VisualApi } from "@saucelabs/visual";
import { formatString } from "../utils/format.js";
import path from "path";
import { PdfFile } from "../app/pdf-file.js";
import { enqueueFromIterator, waitForEmptyQueue } from "../utils/queue.js";
import Queue from "queue";

export interface CreateVisualSnapshotsParams {
  branch: string;
  buildName: string;
  defaultBranch: string;
  project: string;
  customId: string;
  buildId?: string;
  suiteName?: string;
  testName?: string;
  snapshotName?: string;
  concurrency: number;
}

export class VisualSnapshotsApi {
  private api: VisualApi;

  constructor(api: VisualApi) {
    this.api = api;
  }

  public async generateAndSendPdfFileSnapshots(
    pdfFiles: PdfFile[],
    params: CreateVisualSnapshotsParams
  ) {
    const buildId = params.buildId ?? (await this.createBuild(params));

    const queue = new Queue({
      concurrency: params.concurrency,
    });

    const pageIterator = this.iterateOverPages(pdfFiles);
    await enqueueFromIterator(
      queue,
      pageIterator,
      ({ file, page, pageNumber }) =>
        () =>
          this.processPage(
            buildId,
            file,
            page,
            pageNumber,
            params.suiteName,
            params.testName,
            params.snapshotName
          )
    );

    await waitForEmptyQueue(queue);

    await this.finishBuild(buildId);
  }

  private async *iterateOverPages(files: PdfFile[]) {
    for (const file of files) {
      let pageNumber = 1;
      for await (const page of file.convertPagesToImages()) {
        yield { file, page, pageNumber: pageNumber++ } as const;
      }
    }
  }

  private async processPage(
    buildId: string,
    pdfFile: PdfFile,
    page: Buffer,
    pageNumber: number,
    suiteName: string | undefined,
    testNameFormat: string | undefined,
    snapshotNameFormat: string | undefined
  ) {
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

  private async createBuild(
    params: CreateVisualSnapshotsParams
  ): Promise<string> {
    const build = await this.api.createBuild({
      name: params.buildName,
      branch: params.branch,
      defaultBranch: params.defaultBranch,
      project: params.project,
      customId: params.customId,
    });
    console.info(`Build ${build.id} created: ${build.url}`);
    return build.id;
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

  private async finishBuild(buildId: string) {
    await this.api.finishBuild({
      uuid: buildId,
    });
    console.info(`Build ${buildId} finished.`);

    const buildStatus = (await this.api.buildStatus(buildId))!;
    if (
      [BuildStatus.Running, BuildStatus.Queued].includes(buildStatus.status)
    ) {
      console.info(
        `Build ${buildId} finished but snapshots haven't been compared yet. Check the build status in a few moments.`
      );
    } else {
      console.info(
        `Build ${buildId} finished (status=${buildStatus.status}, unapprovedCount=${buildStatus.unapprovedCount}, errorCount=${buildStatus.errorCount}).`
      );
    }
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
