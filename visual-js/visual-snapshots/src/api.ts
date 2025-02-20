import {
  DiffingMethod,
  getApi,
  SauceRegion,
  VisualApi,
} from "@saucelabs/visual";
import { pdf } from "pdf-to-img";

export interface VisualSnapshotsParams {
  username: string;
  accessKey: string;
  region: SauceRegion;
}

export interface CreateVisualSnapshotsParams {
  path: string;
  branch: string;
  buildName: string;
  defaultBranch: string;
  project: string;
  customId: string;
  buildId: string;
}

export class VisualSnapshots {
  private api: VisualApi;

  constructor(params: VisualSnapshotsParams) {
    this.api = getApi(
      {
        user: params.username,
        key: params.accessKey,
        region: params.region,
      },
      {
        userAgent: "visual-snapshots",
      },
    );
  }

  public async generateAndSendPdfFilSnapshotse(
    pdfFilePath: string,
    params: CreateVisualSnapshotsParams,
  ) {
    const buildId = await this.createBuild(params);

    let pageNumber = 1;
    const document = await pdf(pdfFilePath);
    for await (const image of document) {
      await this.uploadImageAndCreateSnapshot(image, buildId, pageNumber);
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
    console.log(`Build ${build.id} created.`);
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

    console.log(`Uploaded image to build ${buildId}: upload id=${uploadId}.`);

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

    console.log(`Created a snapshot ${snapshotName} for build ${buildId}.`);
  }

  private async finishBuild(buildId: string) {
    await this.api.finishBuild({
      uuid: buildId,
    });
    console.log(`Build ${buildId} finished.`);
  }
}
