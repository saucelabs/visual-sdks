import { BuildStatus, DiffingMethod, VisualApi } from "@saucelabs/visual";
import { __dirname } from "../utils/helpers.js";
import { Logger } from "pino";
import { logger as defaultLogger } from "../logger.js";

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
  readonly logger?: Logger;
}

export interface FinishBuildParams {
  readonly buildId: string;
  readonly logger?: Logger;
}

export interface UploadSnapshotParams {
  readonly buildId: string;
  readonly snapshot: Buffer;
  readonly snapshotName: string;
  readonly suiteName?: string;
  readonly testName?: string;
  readonly logger?: Logger;
}

export class VisualSnapshotsApi {
  constructor(private readonly api: VisualApi) {}

  public async createBuild(params: CreateBuildParams): Promise<string> {
    const logger = params.logger ?? defaultLogger;

    const build = await this.api.createBuild({
      name: params.buildName,
      branch: params.branch,
      defaultBranch: params.defaultBranch,
      project: params.project,
      customId: params.customId,
    });

    logger.info(
      {
        buildId: build.id,
        url: build.url,
      },
      `Build created.`
    );

    return build.id;
  }

  public async finishBuild(params: FinishBuildParams) {
    const buildId = params.buildId;
    const logger = params.logger ?? defaultLogger;

    const { status: buildStatus } = await this.api.finishBuild({
      uuid: buildId,
    });

    if ([BuildStatus.Running, BuildStatus.Queued].includes(buildStatus)) {
      logger.info(
        {
          buildId,
          buildStatus,
        },
        `Build finished but snapshots haven't been compared yet. Check the build status in a few moments.`
      );
    } else {
      const { unapprovedCount, errorCount } = (await this.api.buildStatus(
        buildId
      ))!;
      logger.info(
        {
          buildId,
          buildStatus,
          unapprovedCount,
          errorCount,
        },
        `Build finished.`
      );
    }
  }

  public async uploadImageAndCreateSnapshot(params: UploadSnapshotParams) {
    const logger = params.logger ?? defaultLogger;

    const uploadId = await this.api.uploadSnapshot({
      buildId: params.buildId,
      image: { data: params.snapshot },
    });

    logger.info(
      {
        buildId: params.buildId,
        uploadId,
      },
      `Uploaded image to build.`
    );

    await this.api.createSnapshot({
      buildId: params.buildId,
      uploadId,
      name: params.snapshotName,
      diffingMethod: DiffingMethod.Balanced,
      testName: params.testName,
      suiteName: params.suiteName,
    });

    logger.info(
      {
        buildId: params.buildId,
        uploadId,
        snapshotName: params.snapshotName,
        testName: params.testName,
        suiteName: params.suiteName,
      },
      `Created a snapshot for build.`
    );

    return uploadId;
  }
}
