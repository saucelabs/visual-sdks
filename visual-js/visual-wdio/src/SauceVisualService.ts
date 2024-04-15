import type { Services } from '@wdio/types';
import { Testrunner } from '@wdio/types/build/Options';
import {
  RemoteCapabilities,
  RemoteCapability,
} from '@wdio/types/build/Capabilities';
import {
  RegionIn,
  VisualApi,
  getApi,
  WebdriverSession,
  DiffStatus,
  ensureError,
  DiffingMethod,
  SauceRegion,
  getFullPageConfig,
  BuildMode,
} from '@saucelabs/visual';

import logger from '@wdio/logger';
import { SevereServiceError } from 'webdriverio';
import chalk from 'chalk';
import {
  Ignorable,
  IgnoreRegion,
  WdioElement,
  isWdioElement,
  validateIgnoreRegion,
} from './guarded-types.js';
import { backOff } from 'exponential-backoff';
import { Test } from '@wdio/types/build/Frameworks.js';

const clientVersion = 'PKG_VERSION';

const log = logger('@saucelabs/wdio-sauce-visual-service');

const VISUAL_BUILD_ID_KEY = 'SAUCE_VISUAL_BUILD_ID';

const {
  SAUCE_VISUAL_PROJECT,
  SAUCE_VISUAL_BRANCH,
  SAUCE_VISUAL_DEFAULT_BRANCH,
  SAUCE_VISUAL_BUILD_NAME,
  SAUCE_VISUAL_CUSTOM_ID,
} = process.env;

type ResultStatus = {
  [DiffStatus.Approved]: number;
  [DiffStatus.Equal]: number;
  [DiffStatus.Unapproved]: number;
  [DiffStatus.Rejected]: number;
  [DiffStatus.Queued]: number;
};

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
      sauceVisualCheck(name: string, options?: CheckOptions): Promise<void>;
      sauceVisualResults(): Promise<ResultStatus>;
      /**
       * @deprecated Use sauceVisualCheck(). check() will be removed in a future version.
       */
      check(name: string, options?: CheckOptions): Promise<void>;
      /**
       * @deprecated Use sauceVisualResults(). checkResult() will be removed in a future version.
       */
      checkResult(): Promise<ResultStatus>;
    }
  }
}

type SauceVisualServiceOptions = {
  buildName?: string;
  buildId?: string;
  project?: string;
  branch?: string;
  defaultBranch?: string;
  diffingMethod?: DiffingMethod;
  captureDom?: boolean;
  clipSelector?: string;
  region?: SauceRegion;
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
   * A querySelector compatible selector of an element that we should crop the screenshot to.
   */
  clipSelector?: string;
  /**
   * Whether we should take a snapshot of the DOM to compare with as a part of the diffing process.
   */
  captureDom?: boolean;
  diffingMethod?: DiffingMethod;
  fullPage?:
    | boolean
    | {
        delayAfterScrollMs?: number;
        hideAfterFirstScroll?: string[];
      };
};

export let uploadedDiffIds: string[] = [];
let isBuildExternal = false;

// Computes the bounding box of an element relative
// to the top left corner of a screenshot.
function clientSideIgnoreRegionsFromElements(
  elements: HTMLElement[],
): IgnoreRegion[] {
  const elementToBoundingRect = (e: HTMLElement): IgnoreRegion => {
    const clientRect = e.getBoundingClientRect();
    return {
      height: clientRect.height,
      width: clientRect.width,
      x: clientRect.x,
      y: clientRect.y,
    };
  };
  return elements.map(elementToBoundingRect);
}

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

function splitIgnorables(
  a: Array<IgnoreRegion | WdioElement | WdioElement[]>,
): { elements: WdioElement[]; regions: IgnoreRegion[] } {
  const elements: WdioElement[] = [];
  const regions: IgnoreRegion[] = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i];

    if (Array.isArray(x)) {
      elements.concat(...x);
    } else if (isWdioElement(x)) {
      elements.push(x);
    } else {
      try {
        const region = validateIgnoreRegion(x);
        regions.push(region);
      } catch (e) {
        throw new Error(
          `Ignored element options.ignore[${i}] is not valid: ${e}`,
        );
      }
    }
  }
  return { elements, regions };
}

async function wdio2IgnoreRegions(
  elements: WdioElement[],
): Promise<IgnoreRegion[]> {
  // This translation is done for client side scripts by wdio
  const asHtmlElements = elements as unknown as HTMLElement[];

  const ignoreRegions = await browser.execute(
    clientSideIgnoreRegionsFromElements,
    asHtmlElements,
  );

  if (ignoreRegions.length !== elements.length) {
    throw new Error(
      'Internal error while getting the bounding rect for elements',
    );
  }

  // assign the selector as name for the ignore regions
  for (let i = 0; i < ignoreRegions.length; i++) {
    const r = ignoreRegions[i];
    const e = elements[i];
    r.name = e.selector.toString();
  }

  return ignoreRegions;
}

async function toIgnoreRegionIn(ignorables: Ignorable[]): Promise<RegionIn[]> {
  const awaitedIgnorables = await Promise.all(ignorables);
  const { elements, regions } = splitIgnorables(awaitedIgnorables);

  const regionsFromElements = await wdio2IgnoreRegions(elements);

  return [...regions, ...regionsFromElements]
    .map((r) => ({
      name: r.name ?? null,
      x: Math.round(r.x),
      y: Math.round(r.y),
      width: Math.round(r.width),
      height: Math.round(r.height),
    }))
    .filter((r) => 0 < r.width * r.height);
}

/**
 * This services are actually 2 instances at runtimet. OnPrepare and onComplete are executed by one instance and the before hook by another.
 * Those instances cannot share state thus we recreate the api object all the time and share the build id by env variable.
 */
export default class SauceVisualService implements Services.ServiceInstance {
  url?: string;
  test?: { title: string | undefined; parent: string | undefined };
  diffingMethod: DiffingMethod | undefined;
  captureDom: boolean | undefined;
  clipSelector: string | undefined;
  apiClient: VisualApi;

  constructor(
    public options: SauceVisualServiceOptions,
    _capabilities: RemoteCapability,
    public config: Testrunner,
  ) {
    this.diffingMethod = options.diffingMethod;
    this.captureDom = options.captureDom;
    this.clipSelector = options.clipSelector;
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
      try {
        build = await this.apiClient.createBuild({
          name:
            SAUCE_VISUAL_BUILD_NAME ||
            this.options.buildName ||
            'WebdriverIO Visual Testing',
          project: SAUCE_VISUAL_PROJECT || this.options.project || null,
          branch: SAUCE_VISUAL_BRANCH || this.options.branch || null,
          defaultBranch:
            SAUCE_VISUAL_DEFAULT_BRANCH || this.options.defaultBranch || null,
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
    return await backOff(async () => {
      const initialStatusSummary: { [key: string]: number } = {
        [DiffStatus.Approved]: 0,
        [DiffStatus.Equal]: 0,
        [DiffStatus.Unapproved]: 0,
        [DiffStatus.Rejected]: 0,
        [DiffStatus.Queued]: 0,
      };
      const diffsForTestResult = await api.diffsForTestResult(buildId);
      if (!diffsForTestResult) {
        return initialStatusSummary;
      }

      const filterDiffsById = (diff: { id: string; status: DiffStatus }) =>
        uploadedDiffIds.includes(diff.id);
      const statusSummary = diffsForTestResult.nodes
        .filter(filterDiffsById)
        .reduce((statusSummary, diff) => {
          statusSummary[diff.status]++;
          return statusSummary;
        }, initialStatusSummary);
      if (statusSummary[DiffStatus.Queued] > 0) {
        throw new Error('Some diffs are not ready');
      }

      return statusSummary;
    });
  };

  private sauceVisualCheck =
    (
      api: VisualApi,
      browser: WebdriverIO.Browser,
      buildId: string,
      metaInfo: WebdriverSession['blob'],
    ) =>
    async (name: string, options: CheckOptions = {}) => {
      log.info(`Checking ${name}`);
      const ignoreRegions = await toIgnoreRegionIn(options.ignore ?? []);

      const sessionId = browser.sessionId;
      const jobId = (browser.capabilities as any)['jobUuid'] || sessionId;
      const result = await api.createSnapshotFromWebDriver({
        captureDom: options.captureDom ?? this.captureDom,
        clipSelector: options.clipSelector ?? this.clipSelector,
        sessionId,
        jobId,
        buildUuid: buildId,
        name: name,
        ignoreRegions,
        sessionMetadata: metaInfo,
        diffingMethod: options.diffingMethod || this.diffingMethod,
        suiteName: this.test?.parent,
        testName: this.test?.title,
        fullPageConfig: getFullPageConfig(options.fullPage),
      });
      uploadedDiffIds.push(...result.diffs.nodes.flatMap((diff) => diff.id));
      log.info('Check result', result);
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
