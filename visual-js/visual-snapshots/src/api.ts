import {
  DiffingMethod,
  getApi,
  SauceRegion,
  VisualApi,
} from "@saucelabs/visual";
import { pdf } from "pdf-to-img";

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

    let counter = 1;
    const document = await pdf(params.path);
    for await (const image of document) {
      await this.uploadAndCreateSnapshot(image, buildId, buildName, counter);
      counter++;
    }

    await this.api.finishBuild({
      uuid: build.id,
    });
    console.log(`Build ${build.name} (${buildId}) finished.`);
  }

  private async uploadAndCreateSnapshot(
    snapshot: Buffer,
    buildId: string,
    buildName: string,
    index: number,
  ) {
    const uploadId = await this.api.uploadSnapshot({
      buildId,
      image: { data: snapshot },
    });

    console.log(`Uploaded image to build ${buildId}: upload id=${uploadId}.`);

    const snapshotMetadata = {
      diffingMethod: DiffingMethod.Balanced,
      buildUuid: buildId,
      name: `${buildName}-${index}`,
    };

    await this.api.createSnapshot({
      ...snapshotMetadata,
      buildUuid: buildId,
      uploadUuid: uploadId,
    });

    console.log(`Created a snapshot.`);
  }
}
