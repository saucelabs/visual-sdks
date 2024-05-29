import {
  BuildMode,
  DiffStatus,
  displayStatusTable,
  ensureError,
  getApi,
  VisualConfig,
  isSkipMode,
  ensureError,
  BuildMode,
} from '@saucelabs/visual';
import { buildUrlMessage, validateSauce } from '../utils/api';
import { VISUAL_BUILD_ID_KEY } from '../utils/constants';
import SauceVisualCheck from './commands/sauceVisualCheck';
import { NightwatchInternalGlobals } from 'nightwatch/types/globals';
import type { EventEmitter } from 'events';
import { RunnerSettings, SauceVisualAPI } from '../types';

let sharedSettings: RunnerSettings | null = null;
let sauceConfig: VisualConfig | null = null;
let externalBuildId = false;
const {
  SAUCE_VISUAL_PROJECT,
  SAUCE_VISUAL_BRANCH,
  SAUCE_VISUAL_DEFAULT_BRANCH,
  SAUCE_VISUAL_BUILD_NAME,
  SAUCE_VISUAL_CUSTOM_ID,
} = process.env;

const globals: NightwatchInternalGlobals & {
  registerEventHandlers(eventHub: EventEmitter): void;
} = {
  /**
   * Is being called before all tests are run
   */
  // @ts-ignore
  async before(settings: RunnerSettings) {
    console.log('Sauce Visual service started');
    if (isSkipMode()) {
        console.log(
            '⚠︎ SAUCE_VISUAL_SKIP is set. No build will be created. No screenshot will be captured. No Visual assertions will be evaluated.\n',
        );
        return;
    }
    let buildName: string | undefined,
      project: string | undefined,
      branch: string | undefined,
      defaultBranch: string | undefined,
      visualBuildId: string | undefined,
      visualBuildUrl: string | undefined;
    sharedSettings = settings;

    const { sauceVisualService, webdriver: { host, port } = {} } =
      sharedSettings;

    //
    // Some error handling
    validateSauce(host, sauceVisualService);

    ({ buildName, project, branch, defaultBranch } = sauceVisualService);
    sauceConfig = {
      hostname: host,
      port: port,
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
    };
    const build = await getExternalBuild(sauceConfig);

    if (build) {
      externalBuildId = true;
      process.env[VISUAL_BUILD_ID_KEY] = build.id;
      ({ url: visualBuildUrl } = build);
    } else {
      const sauceBuildData = {
        name:
          buildName || SAUCE_VISUAL_BUILD_NAME || 'Nightwatch Visual Testing',
        project: project || SAUCE_VISUAL_PROJECT,
        branch: branch || SAUCE_VISUAL_BRANCH,
        defaultBranch: defaultBranch || SAUCE_VISUAL_DEFAULT_BRANCH,
      };
      try {
        ({ id: visualBuildId, url: visualBuildUrl } = await getApi(
          sauceConfig,
        ).createBuild(sauceBuildData));
        process.env[VISUAL_BUILD_ID_KEY] = visualBuildId;
      } catch (e) {
        const errorMessage = ensureError(e).message ?? 'Unknown error';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
    console.log(buildUrlMessage(visualBuildUrl ?? ''));
  },

  //
  // The global `beforeEach` and `afterEach` will be invoked before and after each test suite (i.e. test file).
  // This works for both the Default JS/TS and Mocha TestRunners.
  async beforeEach() {
    global.uploadedDiffIds = [];
    global.skipped = 0;
  },

  /**
   * Is being called after all tests are run
   */
  async after() {
    if (isSkipMode()) {
      console.log(`⚠︎ Sauce Visual Checks were disabled for that run`);
      return;
    }
    const visualBuildId = process.env[VISUAL_BUILD_ID_KEY] || '';
    if (!visualBuildId) {
      browser.assert.fail('No buildId found');
      return;
    }
    const { sauceVisualService, webdriver: { host } = {} } = sharedSettings!;
    let visualBuildResults: Record<`${DiffStatus}`, number>,
      visualBuildUrl: string | undefined;
    const { failOnFailures } = sauceVisualService;

    //
    // Some error handling
    validateSauce(host, sauceVisualService);

    const api = getApi(sauceConfig!);

    try {
      let build: Awaited<ReturnType<typeof api.build | typeof api.finishBuild>>;
      if (externalBuildId) {
        build = await api.build(visualBuildId);
      } else {
        build = await api.finishBuild({
          uuid: visualBuildId,
        });
      }
      visualBuildUrl = build?.url;
    } catch (e) {
      const errorMessage = ensureError(e).message ?? 'Unknown error';
      browser.assert.fail(errorMessage);
      return;
    }

    if (visualBuildUrl) {
      console.log(buildUrlMessage(visualBuildUrl, { reviewReady: true }));
    }

    try {
      const visualBuild = await api.buildWithDiffs(visualBuildId);
      if (!visualBuild) {
        browser.assert.fail(`build '${visualBuildId}' is unknown`);
        return;
      }

      visualBuildResults = visualBuild.diffs.nodes
        .map((d) => d.status)
        .reduce((r, s) => {
          r[s] = (r[s] ?? 0) + 1;
          return r;
        }, {} as Record<DiffStatus, number>);
    } catch (e) {
      const errorMessage = ensureError(e).message ?? 'Unknown error';
      browser.assert.fail(errorMessage);
      return;
    }

    displayStatusTable(visualBuildId, visualBuildResults);

    if (failOnFailures) {
      browser.assert.ok(
        visualBuildResults.ERRORED === undefined ||
          visualBuildResults.ERRORED === 0,
        "The Sauce Visual Service didn't fail.\n",
      );
    }

    console.log('Sauce Visual service stopped\n');
  },

  // The eventBroadcaster is an EventEmitter instance that can be used to listen to various internal Nightwatch events.
  // See https://github.com/nightwatchjs/nightwatch/blob/main/lib/runner/eventHub.js#L62
  registerEventHandlers(eventBroadcaster) {
    //
    // For JS/TS Default to (re)set the `global.uploadedDiffIds` array for each test.
    eventBroadcaster.on('TestRunStarted', (args) => {
      global.uploadedDiffIds = [];
      global.skipped = 0;
    });

    //
    // For cucumber
    eventBroadcaster.on('TestCaseStarted', (args) => {
      // The beforeEach and TestSuiteStarted are not triggered in CucumberJs
      // that's why we need to (re)set the `global.uploadedDiffIds` array here
      global.uploadedDiffIds = [];
      global.skipped = 0;
      //
      // Logic to get the feature and scenario name
      const reportData = args.report;
      // Appears to generate data off `NightwatchFormatter` class. Since this class has no type
      // information there's not much we can do without diving deep in the code. Keeping it as
      // 'any's for now.
      // TODO: Refactor into TS when source code can be looked through deeply. See below:
      //  node_modules/nightwatch/lib/runner/test-runners/cucumber/nightwatch-format.js
      const testCaseId =
        reportData.testCaseStarted[args.envelope.id].testCaseId;
      const pickleId = reportData.testCases.find(
        (testCase: any) => testCase.id === testCaseId,
      ).pickleId;
      const pickleData = reportData.pickle.find(
        (pickle: any) => pickle.id === pickleId,
      );
      const gherkinDocument = reportData?.gherkinDocument.find(
        (document: any) => document.uri === pickleData.uri,
      );
      const featureData = gherkinDocument.feature;
      const { name: featureName } = featureData;
      const { name: scenarioName } = pickleData;
      SauceVisualCheck.featureName = featureName;
      SauceVisualCheck.scenarioName = scenarioName;
    });
  },
};

const getExternalBuild = async (
  config: VisualConfig,
): Promise<
  | Awaited<ReturnType<SauceVisualAPI['build']>>
  | Awaited<ReturnType<SauceVisualAPI['buildByCustomId']>>
  | void
> => {
  const buildCompletedMsg = `Sauce Labs Visual: cannot add more screenshots since the build is already completed`;

  if (process.env[VISUAL_BUILD_ID_KEY]) {
    try {
      const build = await getApi(config).build(
        process.env[VISUAL_BUILD_ID_KEY],
      );
      if (build?.mode == BuildMode.Completed) {
        console.error(buildCompletedMsg);
        throw new Error(buildCompletedMsg);
      }
      return build;
    } catch (e) {
      const msg = `Sauce Labs Visual: unable to fetch build for buildId ${process.env[VISUAL_BUILD_ID_KEY]}: ${e}`;
      console.error(msg);
      throw new Error(msg);
    }
  }

  if (SAUCE_VISUAL_CUSTOM_ID) {
    try {
      const build = await getApi(config).buildByCustomId(
        SAUCE_VISUAL_CUSTOM_ID,
      );
      if (build?.mode == BuildMode.Completed) {
        console.error(buildCompletedMsg);
        throw new Error(buildCompletedMsg);
      }
      return build;
    } catch (e) {
      const msg = `Sauce Labs Visual: unable to fetch build for customId ${SAUCE_VISUAL_CUSTOM_ID}: ${e}`;
      console.error(msg);
      throw new Error(msg);
    }
  }
};

module.exports = globals;
