const EventEmitter = require('events').EventEmitter;
const {
  ensureError,
  getFullPageConfig,
  selectiveRegionsToRegionIn,
} = require('@saucelabs/visual');
const { parseIgnoreOptions, toIgnoreRegionIn } = require('../../utils/regions');
const { getMetaInfo, getVisualApi } = require('../../utils/api');
const { VISUAL_BUILD_ID_KEY } = require('../../utils/constants');

module.exports = class SauceVisualCheck extends EventEmitter {
  // These are used for Cucumber
  static featureName = '';
  static scenarioName = '';

  // Mocha context can be passed, but
  //  - not for all runners,
  //  - not always as the third argument
  async command(name, optionsArg = {}, mochaContextArg = {}) {
    console.log(`Checking ${name}`);
    const nightwatchBrowserObject = this.api;
    //
    // Check if the first argument is a Mocha context
    const isMochaContext = (arg) => arg.title && arg.ctx?._runnable?.title;
    const [options, mochaContext] = isMochaContext(optionsArg)
      ? [{}, optionsArg]
      : [optionsArg, mochaContextArg];
    //
    // Getting the suite and testname from the current test
    let module = '';
    let defaultTestName = '';
    if (nightwatchBrowserObject && nightwatchBrowserObject.currentTest) {
      module = nightwatchBrowserObject.currentTest.module || '';
      defaultTestName = nightwatchBrowserObject.currentTest.name || '';
    }
    //
    // With CucumberJS we don't get the data, so we use the static values that are being set in on of the
    // global hooks during the eventBroadcaster TestCaseStarted
    // Mocha is done through the mochaContext
    const suiteName =
      mochaContext?.title || SauceVisualCheck.featureName || module || '';
    const testName =
      mochaContext?.ctx?._runnable?.title ||
      SauceVisualCheck.scenarioName ||
      defaultTestName ||
      '';

    // Ignore magic
    const ignoreOptions = options.ignore ?? [];
    const resolvedIgnoreOptions = parseIgnoreOptions(ignoreOptions);
    const ignoreRegions =
      ignoreOptions.length > 0
        ? await toIgnoreRegionIn(resolvedIgnoreOptions)
        : [];
    //
    // Regions
    const regions = await selectiveRegionsToRegionIn(
      options.regions ?? [],
      toIgnoreRegionIn,
    );
    ignoreRegions.push(...regions);
    //
    // Get more info about the session
    const {
      capabilities,
      sessionId,
      options: {
        webdriver: { host, port },
        sauceVisualService: {
          captureDom: globalCaptureDom = false,
          fullPage,
        } = {},
      },
    } = nightwatchBrowserObject;
    const sauceConfig = {
      hostname: host,
      port: port,
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
    };
    const jobId = capabilities['jobUuid'] || sessionId;
    const buildId = process.env[VISUAL_BUILD_ID_KEY] || '';

    if (!buildId) {
      nightwatchBrowserObject.assert.fail('No buildId found');
      this.emit('complete', null);
      return;
    }

    const api = getVisualApi(sauceConfig);
    const metaInfo = await getMetaInfo(api, sessionId, jobId);

    let result = null;

    try {
      result = await api.createSnapshotFromWebDriver({
        sessionId,
        jobId,
        buildUuid: buildId,
        name: name,
        ignoreRegions,
        sessionMetadata: metaInfo,
        suiteName,
        testName,
        fullPageConfig: getFullPageConfig(fullPage, options.fullPage),
        clipSelector: options.clipSelector,
        captureDom: options.captureDom ?? globalCaptureDom,
      });

      global.uploadedDiffIds.push(
        ...result.diffs.nodes.flatMap((diff) => diff.id),
      );
    } catch (e) {
      const errorMessage = ensureError(e).message ?? 'Unknown error';
      nightwatchBrowserObject.assert.fail(errorMessage);
    }

    this.emit('complete', result);
  }
};
