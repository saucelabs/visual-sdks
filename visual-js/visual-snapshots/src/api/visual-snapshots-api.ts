import { BuildStatus, DiffingMethod, VisualApi } from "@saucelabs/visual";

export interface CreateVisualSnapshotsParams {
  branch: string;
  buildName: string;
  defaultBranch: string;
  project: string;
  customId: string;
  buildId: string;
}

export class VisualSnapshotsApi {
  private api: VisualApi;

  constructor(api: VisualApi) {
    this.api = api;
  }

  public async generateAndSendPdfFileSnapshots(
    pdfFilePages: AsyncGenerator<Buffer>,
    params: CreateVisualSnapshotsParams
  ) {
    const buildId = await this.createBuild(params);

    let pageNumber = 1;
    for await (const pdfPageImage of pdfFilePages) {
      await this.uploadImageAndCreateSnapshot(
        pdfPageImage,
        buildId,
        `page-${pageNumber}`
      );
      pageNumber++;
    }

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

  private async uploadImageAndCreateSnapshot(
    snapshot: Buffer,
    buildId: string,
    snapshotName: string
  ) {
    const uploadId = await this.api.uploadSnapshot({
      buildId,
      image: { data: snapshot },
    });

    console.info(`Uploaded image to build ${buildId}: upload id=${uploadId}.`);

    await this.api.createSnapshot({
      buildId,
      uploadId,
      name: snapshotName,
      diffingMethod: DiffingMethod.Balanced,
    });

    console.info(`Created a snapshot ${snapshotName} for build ${buildId}.`);
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
