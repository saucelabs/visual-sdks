/**
 * The content of this file will be evaluated by Cypress main process.
 * It has no access to browser, viewport, etc...
 *
 *
 * It receives info from Cypress browser through *on.task()* hooks.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Browser,
  BuildMode,
  DiffingMethod,
  DiffingOptionsIn,
  DiffStatus,
  ensureError,
  getApi,
  OperatingSystem,
  selectiveRegionOptionsToDiffingOptions,
  VisualApi,
  VisualApiRegion,
  getVisualResults,
  DiffingMethodToleranceIn,
  DiffingMethodSensitivity,
} from '@saucelabs/visual';
import {
  HasSauceConfig,
  SauceVisualOptions,
  ScreenshotMetadata,
} from './types';
import { Logger } from './logger';
import { buildUrl } from './messages';
import chalk from 'chalk';
import macosRelease from 'macos-release';
import { backOff } from 'exponential-backoff';

const clientVersion = 'PKG_VERSION';

const asEnum = <T extends DiffingMethod | DiffingMethodSensitivity>(
  str: T | `${T}` | undefined,
): T => {
  return str as T;
};

const {
  SAUCE_VISUAL_BUILD_NAME,
  SAUCE_VISUAL_BRANCH_NAME,
  SAUCE_VISUAL_DEFAULT_BRANCH_NAME,
  SAUCE_VISUAL_PROJECT_NAME,
  SAUCE_VISUAL_PROJECT,
  SAUCE_VISUAL_BRANCH,
  SAUCE_VISUAL_DEFAULT_BRANCH,
  SAUCE_VISUAL_BUILD_ID,
  SAUCE_VISUAL_CUSTOM_ID,
} = process.env;

function errorMsg(error: unknown) {
  return (error as Error).message || String(error);
}

function correctOsInfo({
  osName,
  osVersion,
}: {
  osName: string;
  osVersion: string;
}): { name: OperatingSystem | null; version: string | null } {
  if (osName === 'darwin') {
    return {
      name: OperatingSystem.Macos,
      version: macosRelease(osVersion)?.version ?? null,
    };
  }
  if (osName === 'win32') {
    return {
      name: OperatingSystem.Windows,
      version: osVersion.split('.')[0],
    };
  }
  return {
    name: null,
    version: null,
  };
}

function cypressBrowserToGraphQL(
  browser: string | undefined,
): string | undefined {
  switch (browser) {
    case 'chrome':
      return 'CHROME';
    case 'firefox':
      return 'FIREFOX';
  }
}

let pluginInstance: CypressSauceVisual | undefined;
const logger: Logger = console;

class DiffNotReadyError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = 'DiffNotReadyError';
  }
}

class CypressSauceVisual {
  private buildId: string | undefined;
  // A build can be managed externally (e.g by CLI) or by the Sauce Visual Cypress plugin
  private isBuildExternal = false;
  private diffingMethod: DiffingMethod | undefined;
  private diffingOptions: DiffingOptionsIn | undefined;
  private diffingMethodTolerance?: DiffingMethodToleranceIn;
  private diffingMethodSensitivity?: DiffingMethodSensitivity;
  private screenshotsMetadata: { [key: string]: ScreenshotMetadata } = {};

  private api: VisualApi;
  private region: VisualApiRegion;
  private jobId: string | undefined;

  private browser?: Cypress.Browser;
  private os?: Cypress.SystemDetails;
  private uploadedDiffIds: string[] = [];
  public domCaptureScript: Promise<string>;

  constructor(config: HasSauceConfig) {
    this.region = VisualApiRegion.fromName(
      process.env.SAUCE_REGION || config.saucelabs?.region || 'us-west-1',
    );
    this.jobId = process.env.SAUCE_JOB_ID;
    this.api = getApi(
      {
        region: this.region.name,
        user: config.saucelabs?.user ?? process.env.SAUCE_USERNAME,
        key: config.saucelabs?.key ?? process.env.SAUCE_ACCESS_KEY,
      },
      {
        userAgent: `visual-cypress/${clientVersion}`,
      },
    );
    this.diffingMethod = asEnum<DiffingMethod>(config.saucelabs?.diffingMethod);
    this.diffingOptions = config.saucelabs?.diffingOptions;
    this.diffingMethodSensitivity = asEnum<DiffingMethodSensitivity>(
      config.saucelabs?.diffingMethodSensitivity,
    );
    this.diffingMethodTolerance = config.saucelabs?.diffingMethodTolerance;
    this.domCaptureScript = this.api.domCaptureScript();
  }

  setBrowser(browser: Cypress.Browser) {
    this.browser = browser;
  }

  setOperationSystem(os: Cypress.SystemDetails) {
    this.os = os;
  }

  async useExistingBuildOrCreate(config: HasSauceConfig) {
    this.buildId = await this.getEffectiveBuild();

    if (this.buildId) {
      this.isBuildExternal = true;
    } else {
      await this.createBuild(config);
    }
  }

  async getEffectiveBuild(): Promise<string | undefined> {
    const buildCompletedMsg = `Sauce Labs Visual: cannot add more screenshots since the build is already completed`;
    if (SAUCE_VISUAL_BUILD_ID) {
      const build = await this.api.build(SAUCE_VISUAL_BUILD_ID);
      if (build?.mode == BuildMode.Completed) {
        logger.error(buildCompletedMsg);
        throw new Error(buildCompletedMsg);
      }
      return SAUCE_VISUAL_BUILD_ID;
    }

    if (SAUCE_VISUAL_CUSTOM_ID) {
      let build;
      try {
        build = await this.api.buildByCustomId(SAUCE_VISUAL_CUSTOM_ID);
      } catch (e) {
        const msg = `Sauce Labs Visual: unable to fetch build for customId ${SAUCE_VISUAL_CUSTOM_ID}: ${errorMsg(
          e,
        )}`;
        logger.error(msg);
        throw new Error(msg);
      }
      if (build?.mode == BuildMode.Completed) {
        logger.error(buildCompletedMsg);
        throw new Error(buildCompletedMsg);
      }
      return build?.id;
    }
  }

  /**
   * Build related actions
   */
  async createBuild(config: HasSauceConfig) {
    if (SAUCE_VISUAL_BRANCH_NAME) {
      logger.warn(
        'Sauce Labs Visual: SAUCE_VISUAL_BRANCH_NAME is deprecated and will be removed in a future version. Please use SAUCE_VISUAL_BRANCH instead',
      );
    }
    if (SAUCE_VISUAL_DEFAULT_BRANCH_NAME) {
      logger.warn(
        'Sauce Labs Visual: SAUCE_VISUAL_DEFAULT_BRANCH_NAME is deprecated and will be removed in a future version. Please use SAUCE_VISUAL_DEFAULT_BRANCH instead',
      );
    }
    if (SAUCE_VISUAL_PROJECT_NAME) {
      logger.warn(
        'Sauce Labs Visual: SAUCE_VISUAL_PROJECT_NAME is deprecated and will be removed in a future version. Please use SAUCE_VISUAL_PROJECT instead',
      );
    }

    try {
      const { id, url } = await this.api.createBuild({
        name:
          config.saucelabs?.buildName ||
          SAUCE_VISUAL_BUILD_NAME ||
          'Cypress Visual Testing',
        project:
          config.saucelabs?.project ||
          SAUCE_VISUAL_PROJECT ||
          SAUCE_VISUAL_PROJECT_NAME ||
          null,
        branch:
          config.saucelabs?.branch ||
          SAUCE_VISUAL_BRANCH ||
          SAUCE_VISUAL_BRANCH_NAME ||
          null,
        defaultBranch:
          config.saucelabs?.defaultBranch ||
          SAUCE_VISUAL_DEFAULT_BRANCH ||
          SAUCE_VISUAL_DEFAULT_BRANCH_NAME ||
          null,
        customId: SAUCE_VISUAL_CUSTOM_ID || null,
        // config.saucelabs?.diffingOptions, // TODO: buildIn doesn't have diffingOptions
      });
      this.buildId = id;
      logger.info(buildUrl(url));
    } catch (e: unknown) {
      logger.error(`
Sauce Labs Visual: Unable to create new build.
  ${chalk.red(errorMsg(ensureError(e).message))}

`);
      logger.error(`The execution of Cypress has been interrupted.`);
      throw new Error('Sauce Labs Visual: Unable to create a build');
    }
  }

  async closeBuild() {
    if (!this.buildId) {
      throw new Error(`Sauce Labs Visual: Build was not created`);
    }

    // Shouldn't finish the build if it's externally managed
    if (this.isBuildExternal) {
      return;
    }

    try {
      const { url } = await this.api.finishBuild({ uuid: this.buildId });
      logger.info(buildUrl(url, { reviewReady: true }));
    } catch (e) {
      const msg = `Sauce Labs Visual: unable to finish build: ${errorMsg(e)}`;
      logger.error(msg);
      throw new Error(msg);
    }
  }

  /**
   * Screenshot management
   */
  addScreenshotMetadata(metadata: ScreenshotMetadata) {
    this.screenshotsMetadata[metadata.id] = metadata;
    return null;
  }

  private async getResultSummary(): Promise<Record<DiffStatus, number>> {
    return await getVisualResults(this.api, {
      buildId: this.buildId,
      diffIds: this.uploadedDiffIds,
    });
  }

  async getTestResults(): Promise<Record<DiffStatus, number>> {
    return await backOff(
      async () => {
        return await this.getResultSummary();
      },
      {
        retry: (error?: Error) => {
          return !!error && error instanceof DiffNotReadyError;
        },
        // See https://www.npmjs.com/package/exponential-backoff#backoffoptions for details
        delayFirstAttempt: true,
        timeMultiple: 2,
        numOfAttempts: 15,
        jitter: 'full',
        startingDelay: 150,
        maxDelay: 10_000,
      },
    );
  }

  async processScreenshot(screenshot: Cypress.ScreenshotDetails) {
    const metadata = this.screenshotsMetadata[screenshot.name];
    if (!metadata) return;

    const osInfo = correctOsInfo(this.os || { osName: '', osVersion: '' });
    let hasFailedUpload = false;

    // Publish image
    try {
      const screenshotId = await this.api.uploadSnapshot({
        buildId: this.buildId ?? '',
        image: { path: screenshot.path },
        dom: metadata.dom ? { data: Buffer.from(metadata.dom) } : undefined,
      });


      const result = await this.api.createSnapshot({
        buildUuid: this.buildId ?? '',
        uploadUuid: screenshotId,
        name: metadata.name,
        browser: (cypressBrowserToGraphQL(this.browser?.name) ??
          null) as Browser,
        browserVersion: (this.browser?.version ?? null) as string,
        operatingSystem: osInfo.name,
        operatingSystemVersion: osInfo.version,
        suiteName: metadata.suiteName,
        testName: metadata.testName,
        ignoreRegions: metadata.regions.map((r) => ({
          ...r.element,
          diffingOptions: selectiveRegionOptionsToDiffingOptions(r),
        })),
        device: metadata.viewport
          ? `Desktop  (${metadata.viewport.width}x${metadata.viewport.height})`
          : 'Desktop',
        devicePixelRatio: metadata.devicePixelRatio,
        diffingMethod: asEnum<DiffingMethod>(
          metadata.diffingMethod || this.diffingMethod || 'BALANCED',
        ),
        diffingOptions: this.diffingOptions,
        diffingMethodTolerance:
          metadata.diffingMethodTolerance || this.diffingMethodTolerance,
        diffingMethodSensitivity: asEnum<DiffingMethodSensitivity>(
          metadata.diffingMethodSensitivity || this.diffingMethodSensitivity,
        ),
        jobUrl: this.jobId ? this.region.jobUrl(this.jobId) : undefined,
      });
      logger.info(`    ${chalk.green('✔')} ${metadata.name} `);
      this.uploadedDiffIds.push(
        ...result.diffs.nodes.flatMap((diff) => diff.id),
      );
    } catch (e) {
      logger.error(
        `    ${chalk.red('✖')} ${metadata.name}: upload failed (${errorMsg(
          e,
        )}))`,
      );
      logger.error(e);
      hasFailedUpload = true;
    }

    if (hasFailedUpload) {
      logger.error(
        `Sauce Labs Visual: Some screenshots have not been uploaded successfully.`,
      );
      logger.error(`The execution of Cypress has been interrupted.`);
      throw new Error('Sauce Labs Visual: Failed to upload some screenshots');
    }
    logger.info(); // add line break
  }

  /**
   * Cleans up leftover screenshot metadata after a spec is complete.
   */
  cleanScreenshot() {
    this.screenshotsMetadata = {};
  }

  /**
   * Wrapper around logging
   */
  log(data: string) {
    logger.info(data);
    return null;
  }

  logColoredWarn(data: string) {
    logger.warn(chalk.yellow(data));
    return null;
  }

  /**
   * Registration of hooks
   */

  static register(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
  ) {
    // Forcefully casting through unknown. We expect user to set their config in cypress.config.[t|j]s
    const pluginConfig = config as unknown as HasSauceConfig;

    const plugin = pluginInstance ?? new CypressSauceVisual(pluginConfig);
    pluginInstance = plugin;

    on('before:run', async (details: Cypress.BeforeRunDetails) => {
      if (details.browser) {
        plugin.setBrowser(details.browser);
      }
      plugin.setOperationSystem(details.system);
      await plugin.useExistingBuildOrCreate(pluginConfig);
    });

    on('before:spec', () => {
      plugin.uploadedDiffIds = [];
    });

    on(
      'after:screenshot',
      async (
        details: Cypress.ScreenshotDetails,
      ): Promise<Cypress.AfterScreenshotReturnObject> => {
        await plugin.processScreenshot(details);
        return details;
      },
    );

    on('after:run', async () => {
      await plugin.closeBuild();
    });

    on('after:spec', async (): Promise<void> => {
      plugin.cleanScreenshot();
    });

    on('task', {
      'get-script': async function () {
        return pluginInstance?.domCaptureScript;
      },
      'visual-register-screenshot': function (metadata: ScreenshotMetadata) {
        return plugin.addScreenshotMetadata(metadata);
      },
      'visual-log-capture': function ({
        screenshotName,
      }: {
        screenshotName: string;
      }) {
        const greyMessage = `sauce-visual: ${screenshotName} `;
        logger.info(`    ${chalk.green('✔')} ${chalk.grey(greyMessage)}`);
        return null;
      },
      'visual-log': function (payload: {
        level: 'info' | 'warn' | 'error';
        msg: string;
      }) {
        switch (payload.level) {
          case 'info':
            logger.info(payload.msg);
          case 'warn':
            logger.warn(payload.msg);
          case 'error':
            logger.error(payload.msg);
        }
        return null;
      },
      'visual-test-results': async function (): Promise<
        Record<DiffStatus, number>
      > {
        return await plugin.getTestResults();
      },
    });
  }
}

export {
  SauceVisualOptions,
  CypressSauceVisual,
  DiffingMethod,
  DiffingMethodSensitivity,
};
