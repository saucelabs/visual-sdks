const chalk = require('chalk');
const { DiffStatus, getApi } = require('@saucelabs/visual');
const { PKG_VER } = require('./constants');

/**
 * Asynchronously retrieves metadata information for a specific WebDriver session from an API.
 * It expects the metadata to contain a 'blob' property, which is then returned.
 *
 * @param {object} api - The API object that provides the method to retrieve session information.
 * @param {string} sessionId - The session ID for which metadata is being retrieved.
 * @param {string} jobId - The job ID associated with the session.
 * @returns {Promise<any>} A promise that resolves to the 'blob' part of the metadata retrieved for the session.
 * @throws {Error} If the retrieved metadata does not contain a 'blob' property or if the 'sessionId' is invalid.
 */
async function getMetaInfo(api, sessionId, jobId) {
  const meta = await api.webdriverSessionInfo({ sessionId, jobId });
  if (!meta?.blob) {
    throw new Error('Invalid sessionId');
  }

  return meta.blob;
}

/**
 * Constructs a formatted message string containing a URL. Optionally includes an additional message
 * indicating the readiness for review based on the options provided.
 *
 * @param {string} url - The URL to be included in the message.
 * @param {object} [options={ reviewReady: false }] - Optional settings, including 'reviewReady' which adds an
 *                                                    additional message if true.
 * @returns {string} The formatted message string containing the URL and, if specified, an additional review readiness message.
 */
function buildUrlMessage(url, options = { reviewReady: false }) {
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
 * Validates the usage of Sauce Labs services by checking the host URL, environment variables for Sauce Labs
 * credentials, and the configuration of the Sauce Visual service.
 *
 * @param {string} host - The host URL to be validated against Sauce Labs usage.
 * @param {object} sauceVisualService - The Sauce Visual service object to check for configuration.
 * @throws {Error} If the host is not part of Sauce Labs, or if the Sauce Labs credentials or the Sauce Visual
 *                 service are not properly configured.
 */
function validateSauce(host, sauceVisualService) {
  if (
    host.match(/^ondemand\.(?:([a-z0-9-]+)\.)?saucelabs\.(?:com|net)$/) === null
  ) {
    throw new Error('This service only works when using Sauce Labs');
  }

  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    throw new Error('Sauce Labs credentials not configured!');
  }

  if (!sauceVisualService) {
    throw new Error('Sauce Visual service not configured');
  }
}

/**
 * Retrieves the visual API client configured with the given sauce configuration and user agent.
 *
 * @param {{
 *   region?: SauceRegion;
 *   protocol?: string;
 *   hostname?: string;
 *   port?: number;
 *   user?: string;
 *   key?: string;
 * }} sauceConfig - The configuration object for the Sauce Labs API.
 * @returns {Object} Returns the API client object configured for visual testing with Nightwatch.
 */
function getVisualApi(sauceConfig) {
  return getApi(sauceConfig, {
    userAgent: `visual-nightwatch/${PKG_VER}`,
  });
}

/**
 * Creates a promise that resolves after a specified duration.
 *
 * @param {number} ms - The amount of time to delay in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

/**
 * Fetches visual result differences (diffs) from the API for a specified build ID.
 * If there are no diffs found, it returns an initial status summary. Otherwise, it filters and
 * aggregates the diffs based on their status, counting each status type.
 *
 * @async
 * @param {object} api - The API object used to fetch diffs for the test result.
 * @param {string} buildId - The identifier of the build for which to retrieve the diffs.
 * @returns {Promise<{ [key: string]: number }>} Resolves to the visual results object once the condition is met or the time limit is reached.
 */
async function retryGetVisualResults(api, buildId) {
  const initialStatusSummary = Object.fromEntries(
    Object.values(DiffStatus).map((status) => [status, 0]),
  );

  const diffsForTestResult = await api.diffsForTestResult(buildId);

  if (!diffsForTestResult) {
    return initialStatusSummary;
  }

  const filterDiffsById = (diff) => global.uploadedDiffIds.includes(diff.id);
  const statusSummary = diffsForTestResult.nodes
    .filter(filterDiffsById)
    .reduce((statusSummary, diff) => {
      statusSummary[diff.status] = (statusSummary[diff.status] || 0) + 1;
      return statusSummary;
    }, initialStatusSummary);
  return statusSummary;
}

/**
 * Continuously fetches visual results until status QUEUED is 0 or a maximum duration has passed.
 * This will repeatedly call 'yourActualGetVisualResultsFunction' every second until
 * 'QUEUED' in the results becomes 0 or the elapsed time exceeds 'maxDuration'.
 *
 * @async
 * @param {object} api - The API object.
 * @param {string} visualBuildId - The visual build identifier for fetching results.
 * @param {number} maxDuration - The maximum duration to keep retrying in milliseconds.
 * @returns {Promise<{ [key: string]: number }>} Resolves to the visual results object once the condition is met or the time limit is reached.
 */
async function getVisualResults(api, visualBuildId, maxDuration) {
  let startTime = Date.now();

  while (true) {
    let results = await retryGetVisualResults(api, visualBuildId);
    if (results.QUEUED === 0 || Date.now() - startTime > maxDuration) {
      return results;
    }
    console.log('Waiting for visual results...');
    await delay(1000);
  }
}

module.exports = {
  buildUrlMessage,
  getMetaInfo,
  getVisualApi,
  getVisualResults,
  validateSauce,
};
