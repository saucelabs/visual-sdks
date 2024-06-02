import {
  ensureError,
  getFullPageConfig,
  isSkipMode,
  parseRegionsForAPI,
  RegionIn,
} from '@saucelabs/visual';
import { parseIgnoreOptions } from '../../utils/regions';
import { getMetaInfo, getVisualApi } from '../../utils/api';
import { VISUAL_BUILD_ID_KEY } from '../../utils/constants';
import type { NightwatchAPI, NightwatchCustomCommandsModel } from 'nightwatch';
import { CheckOptions, RunnerSettings } from '../../types';
import type { Runnable } from 'mocha';
import { WebElement } from 'selenium-webdriver';

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
    const isElement = (element: unknown): element is WebElement =>
      element instanceof WebElement;
    const getElementMeta = async (element: WebElement) => ({
      id: await element.getId(),
    });

    type ParsedElementType = WebElement | WebElement[] | RegionIn;

    const ignorables = (
      await Promise.all(
        parseIgnoreOptions(options.ignore ?? []).map(async (maybeElement) => {
          const awaited = await maybeElement;
          const element: ParsedElementType =
            typeof awaited === 'string'
              ? await this.api.element.findAll(awaited)
              : awaited;
          return {
            element,
          };
        }),
      )
    ).filter(Boolean);
    const regions = await Promise.all(
      (options.regions ?? []).map(async (region) => {
        const { element, ...other } = region;
        const awaited = await element;
        return {
          ...other,
          element: Array.isArray(awaited)
            ? await Promise.all(awaited)
            : awaited,
        };
      }),
    );

    const { ignoreRegions, ignoreElements } =
      await parseRegionsForAPI<ParsedElementType>(
        [...ignorables, ...regions],
        isElement,
        getElementMeta,
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

    return result;
  }
}

export default SauceVisualCheck;
