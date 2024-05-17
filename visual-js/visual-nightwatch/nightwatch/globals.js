const {
  displayStatusTable,
  getApi,
  ensureError,
  BuildMode,
} = require('@saucelabs/visual');
const { buildUrlMessage, validateSauce } = require('../utils/api');
const { VISUAL_BUILD_ID_KEY } = require('../utils/constants');
const SauceVisualCheck = require('./commands/sauceVisualCheck');

let sharedSettings = null;
let sauceConfig = null;
let externalBuildId = false;
const {
  SAUCE_VISUAL_PROJECT,
  SAUCE_VISUAL_BRANCH,
  SAUCE_VISUAL_DEFAULT_BRANCH,
  SAUCE_VISUAL_BUILD_NAME,
  SAUCE_VISUAL_CUSTOM_ID,
} = process.env;

const globals = {
  /**
   * Is being called before all tests are run
   */
  async before(settings) {
    console.log('Sauce Visual service started');
    let buildName,
      project,
      branch,
      defaultBranch,
      visualBuildId,
      visualBuildUrl;
    sharedSettings = settings;

    const {
      sauceVisualService,
      webdriver: { host, port },
    } = sharedSettings;

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
    console.log(buildUrlMessage(visualBuildUrl));
  },

  //
  // The global `beforeEach` and `afterEach` will be invoked before and after each test suite (i.e. test file).
  // This works for both the Default JS/TS and Mocha TestRunners.
  async beforeEach() {
    global.uploadedDiffIds = [];
  },

  /**
   * Is being called after all tests are run
   */
  async after() {
    const visualBuildId = process.env[VISUAL_BUILD_ID_KEY] || '';
    if (!visualBuildId) {
      browser.assert.fail('No buildId found');
      return;
    }
    const {
      sauceVisualService,
      webdriver: { host },
    } = sharedSettings;
    let visualBuildResults, visualBuildUrl;
    const { failOnFailures } = sauceVisualService;

    //
    // Some error handling
    validateSauce(host, sauceVisualService);

    const api = getApi(sauceConfig);

    try {
      if (externalBuildId) {
        ({ url: visualBuildUrl } = await api.build(visualBuildId));
      } else {
        ({ url: visualBuildUrl } = await api.finishBuild({
          uuid: visualBuildId,
        }));
      }
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
        }, {});
    } catch (e) {
      const errorMessage = ensureError(e).message ?? 'Unknown error';
      browser.assert.fail(errorMessage);
      return;
    }

    displayStatusTable(visualBuildId, visualBuildResults);

    if (failOnFailures) {
      browser.assert.ok(
        visualBuildResults.FAILED === undefined ||
          visualBuildResults.FAILED === 0,
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
    });

    //
    // For cucumber
    eventBroadcaster.on('TestCaseStarted', (args) => {
      // The beforeEach and TestSuiteStarted are not triggered in CucumberJs
      // that's why we need to (re)set the `global.uploadedDiffIds` array here
      global.uploadedDiffIds = [];
      //
      // Logic to get the feature and scenario name
      const reportData = args.report;
      const testCaseId =
        reportData.testCaseStarted[args.envelope.id].testCaseId;
      const pickleId = reportData.testCases.find(
        (testCase) => testCase.id === testCaseId,
      ).pickleId;
      const pickleData = reportData.pickle.find(
        (pickle) => pickle.id === pickleId,
      );
      const gherkinDocument = reportData?.gherkinDocument.find(
        (document) => document.uri === pickleData.uri,
      );
      const featureData = gherkinDocument.feature;
      const { name: featureName } = featureData;
      const { name: scenarioName } = pickleData;
      SauceVisualCheck.featureName = featureName;
      SauceVisualCheck.scenarioName = scenarioName;
    });
  },
};

const getExternalBuild = async (config) => {
  const buildCompletedMsg = `Sauce Labs Visual: cannot add more screenshots since the build is already completed`;

  if (process.env[VISUAL_BUILD_ID_KEY]) {
    let build;
    try {
      build = await getApi(config).build(process.env[VISUAL_BUILD_ID_KEY]);
    } catch (e) {
      const msg = `Sauce Labs Visual: unable to fetch build for buildId ${process.env[VISUAL_BUILD_ID_KEY]}: ${e}`;
      console.error(msg);
      throw new Error(msg);
    }
    if (build?.mode == BuildMode.Completed) {
      console.error(buildCompletedMsg);
      throw new Error(buildCompletedMsg);
    }
    return build;
  }

  if (SAUCE_VISUAL_CUSTOM_ID) {
    let build;
    try {
      build = await getApi(config).buildByCustomId(SAUCE_VISUAL_CUSTOM_ID);
    } catch (e) {
      const msg = `Sauce Labs Visual: unable to fetch build for customId ${SAUCE_VISUAL_CUSTOM_ID}: ${e}`;
      console.error(msg);
      throw new Error(msg);
    }
    if (build?.mode == BuildMode.Completed) {
      console.error(buildCompletedMsg);
      throw new Error(buildCompletedMsg);
    }
    return build;
  }
};

module.exports = globals;
