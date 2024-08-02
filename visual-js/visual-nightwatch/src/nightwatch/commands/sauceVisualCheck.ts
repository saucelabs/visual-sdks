import {
  ElementIn,
  ensureError,
  getFullPageConfig,
  isIgnoreRegion,
  isSkipMode,
  parseRegionsForAPI,
  RegionIn,
} from '@saucelabs/visual';
import { getMetaInfo, getVisualApi } from '../../utils/api';
import { VISUAL_BUILD_ID_KEY } from '../../utils/constants';
import { NightwatchAPI, NightwatchCustomCommandsModel } from 'nightwatch';
import { CheckOptions, NightwatchIgnorable, RunnerSettings } from '../../types';
import type { Runnable } from 'mocha';

type APIType = NightwatchAPI & {
  capabilities: Record<string, any>;
  options: RunnerSettings;
};

interface SauceVisualCheck {
  api: APIType;
}

class SauceVisualCheck implements NightwatchCustomCommandsModel {
  // These are used for Cucumber
  static featureName = '';
  static scenarioName = '';

  // Mocha context can be passed, but
  //  - not for all runners,
  //  - not always as the third argument
  async command(name: string, optionsArg = {}, mochaContextArg = {}) {
    console.log(`Checking ${name}`);
    if (isSkipMode()) {
      console.log(`Checking ${name}: SKIPPED`);
      global.skipped = (global.skipped ?? 0) + 1;
      return null;
    }

    const nightwatchBrowserObject = this.api;
    //
    // Check if the first argument is a Mocha context
    const isMochaContext = (arg: Runnable | Record<any, any>) =>
      arg.title &&
      // TODO: Replace with a non-private member / usage.
      // @ts-ignore
      arg.ctx?._runnable?.title;
    const [options, mochaContext] = (
      isMochaContext(optionsArg)
        ? [{}, optionsArg]
        : [optionsArg, mochaContextArg]
    ) as [CheckOptions, Runnable];
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
      // TODO: Replace with a non-private member / usage.
      // @ts-ignore
      mochaContext?.ctx?._runnable?.title ||
      SauceVisualCheck.scenarioName ||
      defaultTestName ||
      '';

    // Ignore magic
    const resolveElement = async (
      promisedItem: FlatArray<NightwatchIgnorable, 1>,
    ): Promise<Array<RegionIn | ElementIn>> => {
      const item = await promisedItem;

      if (typeof item === 'string') {
        const elements = await this.api.element.findAll(item);
        return Promise.all(
          elements.map(async (element) => ({ id: await element.getId() })),
        );
      }

      if (isIgnoreRegion(item)) return [item];

      const elements = Array.isArray(item) ? item : [item];

      return Promise.all(elements.map(async (e) => ({ id: await e.getId() })));
    };

    const { ignoreRegions, ignoreElements } = await parseRegionsForAPI(
      [...(options.ignore ?? []), ...(options.regions ?? [])].flat(),
      resolveElement,
    );

    //
    // Get more info about the session
    const {
      capabilities,
      sessionId,
      options: {
        webdriver: { host, port } = {},
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
      return null;
    }

    const api = getVisualApi(sauceConfig);
    const metaInfo = await getMetaInfo(api, sessionId, jobId);

    let result: Awaited<
      ReturnType<typeof api.createSnapshotFromWebDriver>
    > | null = null;

    const clipElement = options.clipSelector
      ? (await browser.findElement(options.clipSelector)).getId()
      : null;

    try {
      result = await api.createSnapshotFromWebDriver({
        sessionId,
        jobId,
        buildUuid: buildId,
        name: name,
        ignoreRegions,
        ignoreElements,
        sessionMetadata: metaInfo,
        suiteName,
        testName,
        fullPageConfig: getFullPageConfig(fullPage, options.fullPage),
        clipElement: (await options.clipElement?.getId()) ?? clipElement,
        captureDom: options.captureDom ?? globalCaptureDom,
      });

      global.uploadedDiffIds.push(
        ...result.diffs.nodes.flatMap((diff) => diff.id),
      );
    } catch (e) {
      const errorMessage = ensureError(e).message ?? 'Unknown error';
      nightwatchBrowserObject.assert.fail(errorMessage);
    }

    return result;
  }
}

export default SauceVisualCheck;
