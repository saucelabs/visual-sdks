import { BuildStatus, DiffingMethod, VisualApi } from "@saucelabs/visual";
import { __dirname } from "../utils/helpers.js";

export interface CreateVisualSnapshotsParams {
  branch?: string;
  buildName?: string;
  defaultBranch?: string;
  project?: string;
  customId?: string;
  buildId?: string;
  suiteName?: string;
  testName?: string;
  snapshotName?: string;
}

export interface CreateBuildParams {
  readonly buildName?: string;
  readonly branch?: string;
  readonly defaultBranch?: string;
  readonly project?: string;
  readonly customId?: string;
}

export interface UploadSnapshotParams {
  readonly buildId: string;
  readonly snapshot: Buffer;
  readonly snapshotName: string;
  readonly suiteName?: string;
  readonly testName?: string;
}

export class VisualSnapshotsApi {
  constructor(private readonly api: VisualApi) {}

  public async createBuild(params: CreateBuildParams): Promise<string> {
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

  public async finishBuild(buildId: string) {
    const { status: buildStatus } = await this.api.finishBuild({
      uuid: buildId,
    });

    if ([BuildStatus.Running, BuildStatus.Queued].includes(buildStatus)) {
      console.info(
        `Build ${buildId} finished but snapshots haven't been compared yet. Check the build status in a few moments.`
      );
    } else {
      const { unapprovedCount, errorCount } = (await this.api.buildStatus(
        buildId
      ))!;
      console.info(
        `Build ${buildId} finished (status=${buildStatus}, unapprovedCount=${unapprovedCount}, errorCount=${errorCount}).`
      );
    }
  }

  public async uploadImageAndCreateSnapshot(params: UploadSnapshotParams) {
    const uploadId = await this.api.uploadSnapshot({
      buildId: params.buildId,
      image: { data: params.snapshot },
    });

    console.info(
      `Uploaded image to build ${params.buildId}: upload id=${uploadId}.`
    );

    await this.api.createSnapshot({
      buildId: params.buildId,
      uploadId,
      name: params.snapshotName,
      diffingMethod: DiffingMethod.Balanced,
      testName: params.testName,
      suiteName: params.suiteName,
    });

    console.info(
      `Created a snapshot ${params.snapshotName} for build ${params.buildId}.`
    );

    return uploadId;
  }
}
