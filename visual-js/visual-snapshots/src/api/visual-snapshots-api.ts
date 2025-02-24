import { DiffingMethod, VisualApi } from "@saucelabs/visual";

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

  public async generateAndSendPdfFilSnapshots(
    pdfFilePages: AsyncGenerator<Buffer>,
    params: CreateVisualSnapshotsParams,
  ) {
    const buildId = await this.createBuild(params);

    let pageNumber = 1;
    for await (const pdfPageImage of pdfFilePages) {
      await this.uploadImageAndCreateSnapshot(
        pdfPageImage,
        buildId,
        pageNumber,
      );
      pageNumber++;
    }

    await this.finishBuild(buildId);
  }

  private async createBuild(
    params: CreateVisualSnapshotsParams,
  ): Promise<string> {
    const build = await this.api.createBuild({
      name: params.buildName,
      branch: params.branch,
      defaultBranch: params.defaultBranch,
      project: params.project,
      customId: params.customId,
    });
    console.info(`Build ${build.id} created.`);
    return build.id;
  }

  private async uploadImageAndCreateSnapshot(
    snapshot: Buffer,
    buildId: string,
    snapshotId: number,
  ) {
    const uploadId = await this.api.uploadSnapshot({
      buildId,
      image: { data: snapshot },
    });

    console.info(`Uploaded image to build ${buildId}: upload id=${uploadId}.`);

    const snapshotName = `page-${snapshotId}`;
    const snapshotMetadata = {
      diffingMethod: DiffingMethod.Balanced,
      buildUuid: buildId,
      name: snapshotName,
    };

    await this.api.createSnapshot({
      ...snapshotMetadata,
      buildUuid: buildId,
      uploadUuid: uploadId,
    });

    console.info(`Created a snapshot ${snapshotName} for build ${buildId}.`);
  }

  private async finishBuild(buildId: string) {
    await this.api.finishBuild({
      uuid: buildId,
    });
    console.info(`Build ${buildId} finished.`);
  }
}
