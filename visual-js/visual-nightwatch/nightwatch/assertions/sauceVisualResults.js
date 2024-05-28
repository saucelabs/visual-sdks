const { DiffStatus, isSkipMode } = require('@saucelabs/visual');
const { getVisualApi, getVisualResults } = require('../../utils/api');
const { VISUAL_BUILD_ID_KEY } = require('../../utils/constants');

// See https://nightwatchjs.org/guide/extending-nightwatch/adding-custom-assertions.html#define-a-custom-assertion
exports.assertion = function sauceVisualResults(diffStatus, expected, msg) {
  /**
   * Returns the expected value of the assertion which is displayed in the case of a failure
   *
   * @return {string}
   */
  this.expected = function () {
    return this.negate ? `not equal '${expected}'` : `equals '${expected}'`;
  };

  /**
   * Returns the message format which will be used to output the message in the console and also
   *  the arguments which will be used for replace the place holders, used in the order of appearance
   *
   * The message format also takes into account whether the .not negate has been used
   *
   * @return {{args: [], message: string}}
   */
  this.formatMessage = function () {
    const message =
      msg ||
      `Validating if the diff-status %s ${
        this.negate ? "doesn't equal %s" : 'equals %s'
      }`;

    return {
      message,
      args: [diffStatus, `'${expected}'`],
    };
  };

  /**
   * Given the value, the condition used to evaluate if the assertion is passed
   * @param {*} value
   * @return {Boolean}
   */
  this.evaluate = function (value) {
    return value === expected;
  };

  /**
   * Called with the result object of the command to retrieve the value which is to be evaluated
   *
   * @param {Object} result
   * @return {*}
   */
  this.value = function (result = {}) {
    return result.value;
  };

  /**
   * The command which is to be executed by the assertion runner; Nightwatch api is available as this.api
   * @param {function} callback
   */
  this.command = async function (callback) {
    // Return only SKIPPED if in skip mode
    if (isSkipMode()) {
      const statusSummary = Object.fromEntries(
        Object.values(DiffStatus).map((status) => [status, 0]),
      );
      statusSummary['SKIPPED'] = global.skipped;
      callback({
        value: statusSummary[diffStatus],
      });
      return this;
    }

    const visualBuildId = process.env[VISUAL_BUILD_ID_KEY] || '';
    if (!visualBuildId) {
      // We can't throw an error here otherwise the test will stop and the Visual Build will never be finished
      this.api.assert.fail('No Visual Build found');
      return;
    }
    if (!Object.values(DiffStatus).includes(diffStatus)) {
      // We can't throw an error here otherwise the test will stop and the Visual Build will never be finished
      this.api.assert.fail(
        `Invalid argument: ${diffStatus} is not a valid diffStatus. Valid diffStatuses are: ${Object.values(
          DiffStatus,
        ).join(', ')}`,
      );
      return;
    }

    const {
      options: {
        webdriver: { host, port },
      },
    } = this.api;
    const sauceConfig = {
      hostname: host,
      port: port,
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
    };

    const visualApi = getVisualApi(sauceConfig);
    const maxDuration = 60000;
    const visualResults = await getVisualResults(
      visualApi,
      visualBuildId,
      maxDuration,
    );

    if (visualResults.QUEUED > 0) {
      console.log(
        `\nThere are still ${visualResults.QUEUED} visual diffs queued after waiting for maxDuration of ${maxDuration}ms.\n`,
      );
    }

    // The object containing a "value" property will be passed to the .value() method to determine the value
    // which is to be evaluated (by the .evaluate() method)
    callback({
      value: visualResults[diffStatus],
    });

    return this;
  };
};
