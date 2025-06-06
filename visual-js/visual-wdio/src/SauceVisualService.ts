import type { Services } from '@wdio/types';
import { SevereServiceError } from 'webdriverio';
import type { Testrunner } from '@wdio/types/build/Options';
import type {
  RemoteCapabilities,
  RemoteCapability,
} from '@wdio/types/build/Capabilities';
import {
  BuildMode,
  DiffingMethod,
  DiffingOptionsIn,
  DiffStatus,
  ElementIn,
  ensureError,
  getApi,
  getFullPageConfig,
  isIgnoreRegion,
  parseRegionsForAPI,
  RegionIn,
  RegionType,
  SauceRegion,
  selectiveRegionOptionsToDiffingOptions,
  BaselineOverrideIn,
  VisualApi,
  WebdriverSession,
  getVisualResults,
  isIgnoreSelectorType,
  IgnoreSelectorIn,
  getEnvOpts,
  DiffingMethodSensitivity,
  DiffingMethodToleranceIn,
} from '@saucelabs/visual';

import logger from '@wdio/logger';
import chalk from 'chalk';
import {
  FullPageScreenshotWdioOptions,
  Ignorable,
  isWdioElement,
  WdioElement,
} from './guarded-types.js';
import type { Test } from '@wdio/types/build/Frameworks';

const clientVersion = 'PKG_VERSION';

const log = logger('@saucelabs/wdio-sauce-visual-service');

const VISUAL_BUILD_ID_KEY = 'SAUCE_VISUAL_BUILD_ID';

const { SAUCE_VISUAL_BUILD_NAME, SAUCE_VISUAL_CUSTOM_ID } = process.env;

type ResultStatus = Record<DiffStatus, number>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace WebdriverIO {
    interface Browser {
      createBuild(args: {
        buildName: string;
        project: string;
        branch: string;
        defaultBranch?: string;
      }): Promise<string>;
      sauceVisualCheck(
        name: string,
        options?: CheckOptions,
      ): Promise<{ snapshotId: string }>;
      sauceVisualResults(): Promise<ResultStatus>;
      /**
       * @deprecated Use sauceVisualCheck(). check() will be removed in a future version.
       */
      check(
        name: string,
        options?: CheckOptions,
      ): Promise<{ snapshotId: string }>;
      /**
       * @deprecated Use sauceVisualResults(). checkResult() will be removed in a future version.
       */
      checkResult(): Promise<ResultStatus>;
    }
  }
}

export type SauceVisualServiceOptions = {
  buildName?: string;
  buildId?: string;
  project?: string;
  branch?: string;
  customId?: string;
  defaultBranch?: string;
  diffingMethod?: DiffingMethod;
  /**
   * Use one of a few presets from Sauce Labs to tweak the diffing sensitivity for the 'Balanced'
   * diffing method. Controls the various tolerance options all at once.
   */
  diffingMethodSensitivity?: DiffingMethodSensitivity;
  /**
   * Controls one or more of the options available to adjust the sensitivity of the 'Balanced'
   * diffing method directly.
   */
  diffingMethodTolerance?: DiffingMethodToleranceIn;
  captureDom?: boolean;
  clipSelector?: string;
  clipElement?: WdioElement;
  region?: SauceRegion;
  fullPage?: FullPageScreenshotWdioOptions;
  baselineOverride?: BaselineOverrideIn;
  hideScrollBars?: boolean;
};

// This type is derived from what provides Cucumber as framework
// A brief object definition is made to avoid pull all the Cucumber dependency
// in our plugin just for the sake of reading the feature/scenario name.
type CucumberWorld = {
  gherkinDocument?: {
    feature?: {
      name?: string;
    };
  };
  pickle?: {
    name?: string;
  };
};

export type CheckOptions = {
  ignore?: Array<Ignorable>;

  /**
   * XPath selectors to ignore changes (available only with full-page screenshots and mobile native apps).
   */
  ignoreSelectors?: Array<string>;

  regions?: Array<RegionType<Ignorable>>;
  /**
   * A querySelector compatible selector of an element that we should crop the screenshot to.
   */
  clipSelector?: string;
  /**
   * A WdioElement that we should crop the screenshot to. Takes priority over a clipSelector
   */
  clipElement?: WdioElement;
  /**
   * Whether we should take a snapshot of the DOM to compare with as a part of the diffing process.
   */
  captureDom?: boolean;
  diffingMethod?: DiffingMethod;
  /**
   * Use one of a few presets from Sauce Labs to tweak the diffing sensitivity for the 'Balanced'
   * diffing method. Controls the various tolerance options all at once.
   */
  diffingMethodSensitivity?: DiffingMethodSensitivity;
  /**
   * Controls one or more of the options available to adjust the sensitivity of the 'Balanced'
   * diffing method directly.
   */
  diffingMethodTolerance?: DiffingMethodToleranceIn;
  disable?: (keyof DiffingOptionsIn)[];
  fullPage?: FullPageScreenshotWdioOptions;
  baselineOverride?: BaselineOverrideIn;
  /**
   * Hide all scrollbars in the web app. Default value is `true`.
   */
  hideScrollBars?: boolean;
};

export let uploadedDiffIds: string[] = [];
let isBuildExternal = false;

function buildUrlMessage(
  url: string,
  options: { reviewReady: boolean } = { reviewReady: false },
): string {
  const extraMsg = options.reviewReady
    ? chalk.grey(chalk.italic('You can now review your changes\n'))
    : '';

  return `

  ${chalk.yellow(chalk.bold(chalk.underline('SauceVisual')))}
  ${extraMsg}
${url.padStart(100, ' ')}
`;
}

/**
 * This services are actually 2 instances at runtime. OnPrepare and onComplete are executed by one instance and the before hook by another.
 * Those instances cannot share state thus we recreate the api object all the time and share the build id by env variable.
 */
export default class SauceVisualService implements Services.ServiceInstance {
  url?: string;
  test?: { title: string | undefined; parent: string | undefined };
  diffingMethod: DiffingMethod | undefined;
  diffingMethodSensitivity: DiffingMethodSensitivity | undefined | null;
  diffingMethodTolerance: DiffingMethodToleranceIn | undefined | null;
  captureDom: boolean | undefined;
  clipSelector: string | undefined;
  clipElement: WdioElement | undefined;
  fullPage?: FullPageScreenshotWdioOptions;
  apiClient: VisualApi;
  baselineOverride?: BaselineOverrideIn;
  hideScrollBars?: boolean;

  constructor(
    public options: SauceVisualServiceOptions,
    _capabilities: RemoteCapability,
    public config: Testrunner,
  ) {
    this.diffingMethod = options.diffingMethod;
    this.diffingMethodSensitivity = options.diffingMethodSensitivity;
    this.diffingMethodTolerance = options.diffingMethodTolerance;
    this.captureDom = options.captureDom;
    this.clipSelector = options.clipSelector;
    this.clipElement = options.clipElement;
    this.fullPage = options.fullPage;
    this.baselineOverride = options.baselineOverride;
    this.hideScrollBars = options.hideScrollBars;
    this.apiClient = getApi(
      {
        ...this.config,
        region: options.region || this.config.region,
      },
      {
        userAgent: `visual-wdio/${clientVersion}`,
      },
    );
  }

  async onPrepare(
    _config: Testrunner,
    _capabilities: RemoteCapabilities,
  ): Promise<void> {
    log.info('Sauce Visual service started');
    const build = await this.getExternalBuild(this.apiClient);
    if (build) {
      process.env[VISUAL_BUILD_ID_KEY] = build.id;
      this.url = build.url;
      isBuildExternal = true;
    } else {
      let build;
      const { customId, defaultBranch, branch, project } = getEnvOpts();
      try {
        build = await this.apiClient.createBuild({
          name:
            this.options.buildName ||
            SAUCE_VISUAL_BUILD_NAME ||
            'WebdriverIO Visual Testing',
          project: this.options.project || project,
          branch: this.options.branch || branch,
          defaultBranch: this.options.defaultBranch || defaultBranch,
          customId: this.options.customId || customId,
        });
      } catch (e: unknown) {
        const errorMessage = ensureError(e).message ?? 'Unknown error';
        log.error(errorMessage);
        throw new SevereServiceError(errorMessage);
      }
      this.url = build.url;

      log.info(buildUrlMessage(this.url));
      process.env[VISUAL_BUILD_ID_KEY] = build.id;
    }
  }

  async onComplete(
    _exitCode: number,
    _config: Omit<Testrunner, 'capabilities'>,
  ) {
    const buildId = process.env[VISUAL_BUILD_ID_KEY] || '';

    if (!isBuildExternal) {
      await this.apiClient.finishBuild({ uuid: buildId });
    }
    log.info(buildUrlMessage(this.url || '', { reviewReady: true }));
  }

  /**
   * this browser object is passed in here for the first time
   */
  async before(
    capabilities: RemoteCapability,
    specs: string[],
    browser: WebdriverIO.Browser,
  ): Promise<void> {
    const buildId = process.env[VISUAL_BUILD_ID_KEY];

    if (!buildId) {
      throw new SevereServiceError(
        'Sauce Visual service cannot detect build id',
      );
    }

    const sessionId = browser.sessionId;
    const jobId = (browser.capabilities as any)['jobUuid'] || sessionId;

    const meta = await this.getMetaInfo(this.apiClient, sessionId, jobId);
    browser.addCommand('createBuild', this.createBuild(this.apiClient));
    browser.addCommand(
      'sauceVisualCheck',
      this.sauceVisualCheck(this.apiClient, browser, buildId, meta),
    );
    browser.addCommand(
      'sauceVisualResults',
      this.sauceVisualResults(this.apiClient, buildId),
    );
    /**
     * The following bindings will be removed in a future version.
     */
    browser.addCommand('check', async (name, options) => {
      log.warn(
        `Method "check()" is deprecated and will be removed in a future version. Please use "sauceVisualCheck()".`,
      );
      await this.sauceVisualCheck(
        this.apiClient,
        browser,
        buildId,
        meta,
      )(name, options);
    });
    browser.addCommand('checkResult', async () => {
      log.warn(
        `Method "checkResult()" is deprecated and will be removed in a future version. Please use "sauceVisualResults()".`,
      );
      await this.sauceVisualResults(this.apiClient, buildId)();
    });
  }

  private getTitleAndParent(test: Test): {
    title: string | undefined;
    parent: string | undefined;
  } {
    let title: string | undefined = test.title;
    let parent: string | undefined = test.parent;

    /**
     * When using Jasmine as the framework the title/parent are not set as with mocha.
     *
     * `fullName` contains all describe(), and it() separated by a space.
     * `description` contains the current it() statement.
     *
     * e.g.:
     * With the following configuration
     *
     * describe('x', () => {
     *   describe('y', () => {
     *     it('z', () => {});
     *   })
     * })
     *
     * fullName will be "x y z"
     * description will be "z"
     *
     */
    if (this.config?.framework === 'jasmine') {
      title = test.description;
      parent = test.fullName?.replace(` ${title}`, '');
    }
    return {
      title,
      parent,
    };
  }

  // Mocha/Jasmine Only
  beforeTest(test: Test, _context: any): void {
    uploadedDiffIds = [];
    this.test = this.getTitleAndParent(test);
  }

  // Cucumber Only
  beforeScenario(world: CucumberWorld): void {
    uploadedDiffIds = [];
    this.test = {
      title: world?.pickle?.name,
      parent: world?.gherkinDocument?.feature?.name,
    };
  }

  private getMetaInfo = async (
    api: VisualApi,
    sessionId: string,
    jobId: string,
  ): Promise<WebdriverSession['blob']> => {
    const meta = await api.webdriverSessionInfo({ sessionId, jobId });
    if (!meta?.blob) throw new Error('Invalid sessionId');
    return meta.blob;
  };

  public sauceVisualResults = (api: VisualApi, buildId: string) => async () => {
    return await getVisualResults(api, { buildId, diffIds: uploadedDiffIds });
  };

  private sauceVisualCheck =
    (
      api: VisualApi,
      browser: WebdriverIO.Browser,
      buildId: string,
      metaInfo: WebdriverSession['blob'],
    ) =>
    async (
      name: string,
      options: CheckOptions = {},
    ): ReturnType<WebdriverIO.Browser['sauceVisualCheck']> => {
      log.info(`Checking ${name}`);

      const resolveIgnorable = async (
        element: Ignorable | Promise<RegionIn>,
      ): Promise<Array<RegionIn | ElementIn | IgnoreSelectorIn>> => {
        if (isIgnoreRegion(element)) return [element];

        const awaited = await element;
        if (isIgnoreRegion(awaited)) return [awaited];
        if (isIgnoreSelectorType(awaited)) return [awaited];

        const wdioElements = isWdioElement(awaited) ? [awaited] : awaited;

        return wdioElements.map((e) => ({
          id: e.elementId,
          name: e.selector.toString(),
        }));
      };

      const { ignoreRegions, ignoreElements, ignoreSelectors } =
        await parseRegionsForAPI(
          [...(options.regions ?? []), ...(options.ignore ?? [])],
          resolveIgnorable,
        );

      const sessionId = browser.sessionId;
      const jobId = (browser.capabilities as any)['jobUuid'] || sessionId;

      const fullPageConfig = await getFullPageConfig<WdioElement>(
        this.fullPage,
        options.fullPage,
        (el) => el.elementId,
      );

      const clipSelector = options.clipSelector ?? this.clipSelector;
      const clipElement = clipSelector
        ? await browser.$(clipSelector).elementId
        : null;

      const result = await api.createSnapshotFromWebDriver({
        captureDom: options.captureDom ?? this.captureDom,
        clipElement:
          options.clipElement?.elementId ??
          this.clipElement?.elementId ??
          clipElement,
        sessionId,
        jobId,
        buildUuid: buildId,
        name: name,
        ignoreRegions,
        ignoreSelectors,
        ignoreElements,
        diffingOptions: selectiveRegionOptionsToDiffingOptions({
          disableOnly: options.disable ?? [],
        }),
        diffingMethodTolerance:
          options.diffingMethodTolerance ?? this.diffingMethodTolerance ?? null,
        diffingMethodSensitivity:
          options.diffingMethodSensitivity ??
          this.diffingMethodSensitivity ??
          null,
        sessionMetadata: metaInfo,
        diffingMethod:
          options.diffingMethod || this.diffingMethod || DiffingMethod.Balanced,
        suiteName: this.test?.parent,
        testName: this.test?.title,
        fullPageConfig,
        baselineOverride: options.baselineOverride || this.baselineOverride,
        hideScrollBars: options.hideScrollBars ?? this.hideScrollBars,
      });
      uploadedDiffIds.push(...result.diffs.nodes.flatMap((diff) => diff.id));
      log.info('Check result', result);
      return {
        snapshotId: result.id,
      };
    };

  private createBuild =
    (api: VisualApi) => async (args: { buildName: string }) => {
      const { id } = await api.createBuild({
        name: args.buildName,
        branch: null,
        defaultBranch: null,
        project: null,
      });
      return id;
    };

  async getExternalBuild(api: VisualApi) {
    const buildCompletedMsg = `Sauce Labs Visual: cannot add more screenshots since the build is already completed`;

    if (this.options.buildId) {
      let build;
      try {
        build = await api.build(this.options.buildId);
      } catch (e) {
        const msg = `Sauce Labs Visual: unable to fetch build for buildId ${this.options.buildId}: ${e}`;
        log.error(msg);
        throw new SevereServiceError(msg);
      }
      if (build?.mode == BuildMode.Completed) {
        log.error(buildCompletedMsg);
        throw new SevereServiceError(buildCompletedMsg);
      }
      return build;
    }

    if (process.env[VISUAL_BUILD_ID_KEY]) {
      let build;
      try {
        build = await api.build(process.env[VISUAL_BUILD_ID_KEY]);
      } catch (e) {
        const msg = `Sauce Labs Visual: unable to fetch build for buildId ${process.env[VISUAL_BUILD_ID_KEY]}: ${e}`;
        log.error(msg);
        throw new SevereServiceError(msg);
      }
      if (build?.mode == BuildMode.Completed) {
        log.error(buildCompletedMsg);
        throw new SevereServiceError(buildCompletedMsg);
      }
      return build;
    }

    if (SAUCE_VISUAL_CUSTOM_ID) {
      let build;
      try {
        build = await api.buildByCustomId(SAUCE_VISUAL_CUSTOM_ID);
      } catch (e) {
        const msg = `Sauce Labs Visual: unable to fetch build for customId ${SAUCE_VISUAL_CUSTOM_ID}: ${e}`;
        log.error(msg);
        throw new SevereServiceError(msg);
      }
      if (build?.mode == BuildMode.Completed) {
        log.error(buildCompletedMsg);
        throw new SevereServiceError(buildCompletedMsg);
      }
      return build;
    }
  }
}
