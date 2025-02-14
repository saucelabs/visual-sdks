import {
  DiffingMethod,
  getApi,
  SauceRegion,
  VisualApi,
} from "@saucelabs/visual";

export interface CreateVisualSnapshotsParams {
  path: string;
  branch: string;
  buildName: string;
  defaultBranch: string;
  project: string;
  customId: string;
}

export class VisualSnapshots {
  private api: VisualApi;

  constructor(username: string, accessKey: string, region: SauceRegion) {
    this.api = getApi(
      {
        user: username,
        key: accessKey,
        region,
      },
      {
        userAgent: "visual-snapshots",
      },
    );
  }

  public async generateAndSendPdfFilSnapshotse(
    params: CreateVisualSnapshotsParams,
  ) {
    const build = await this.api.createBuild({
      name: params.buildName,
      branch: params.branch,
      defaultBranch: params.defaultBranch,
      project: params.project,
      customId: params.customId,
    });
    const buildId = build.id as string;
    const buildName = params.buildName as string;
    console.log(`Build ${buildName} (${buildId}) creatted.`);

    const snapshots: Array<Buffer> = this.generatePdfFileSnapshots();
    snapshots.forEach((snapshot) =>
      this.uploadAndCreateSnapshot(snapshot, buildId, buildName),
    );

    await this.api.finishBuild({
      uuid: build.id,
    });
    console.log(`Build ${build.name} (${buildId}) finished.`);
  }

  private generatePdfFileSnapshots(): Array<Buffer> {
    return [];
  }

  private async uploadAndCreateSnapshot(
    snapshot: Buffer,
    buildId: string,
    buildName: string,
  ) {
    const uploadId = await this.api.uploadSnapshot({
      buildId,
      image: { data: snapshot },
    });

    console.log(`Uploaded image to build ${buildId}: upload id=${uploadId}.`);

    const snapshotMetadata = {
      diffingMethod: DiffingMethod.Balanced,
      buildUuid: buildId,
      name: buildName,
    };

    await this.api.createSnapshot({
      ...snapshotMetadata,
      buildUuid: buildId,
      uploadUuid: uploadId,
    });

    console.log(`Created a snapshot.`);
  }
}
