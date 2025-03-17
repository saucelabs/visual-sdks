import { BuildStatus, VisualApi } from "@saucelabs/visual";
import { __dirname } from "../utils/helpers.js";
import { PdfSnapshotUploader } from "./pdf-files-snapshot-uploader.js";

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
}

export class VisualSnapshotsApi {
  constructor(
    private readonly api: VisualApi,
    private readonly pdfSnapshotUploader: PdfSnapshotUploader
  ) {}

  public async generateAndSendPdfFileSnapshots(
    pdfFilePaths: string[],
    params: CreateVisualSnapshotsParams
  ) {
    const buildId = params.buildId ?? (await this.createBuild(params));

    await this.pdfSnapshotUploader.uploadSnapshots({
      buildId,
      pdfFilePaths,
      suiteName: params.suiteName,
      testNameFormat: params.testName,
      snapshotNameFormat: params.snapshotName,
    });

    await this.finishBuild(buildId);
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
}
