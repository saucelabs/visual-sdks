import { expect, test } from '@jest/globals';
import { getApi } from './api.js';
import { Builder } from 'selenium-webdriver';

const CREDENTIALS = {
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
};

const api = getApi({ region: 'us-west-1', ...CREDENTIALS });

test('create and finish build', async () => {
  const { id, status } = await api.createBuild({
    name: 'A Test Build',
    branch: null,
    project: null,
  });
  expect(status).toBe('RUNNING');

  {
    const { status } = await api.finishBuild({ id });
    expect(status).toBe('EMPTY');
  }

  {
    const { status } = await api.finishBuild({ id });
    expect(status).toBe('EMPTY');
  }
});

test(
  'get meta info for wd session',
  async () => {
    const { id: buildId } = await api.createBuild({
      name: 'A Test Build',
      branch: null,
      project: null,
    });
    const driver = await new Builder()
      .usingServer(
        `https://${CREDENTIALS.user}:${CREDENTIALS.key}@ondemand.us-west-1.saucelabs.com/wd/hub`,
      )
      .withCapabilities({
        browserName: 'Chrome',
      })
      .build();

    const session = await driver.getSession();
    const sessionId = (await driver.getSession()).getId();
    const jobId = session.getCapabilities().get('jobUuid') || sessionId;

    await driver.get('https://www.saucelabs.com');

    const metaInfo = await api.webdriverSessionInfo({
      sessionId,
      jobId,
    });

    const uploadId = await api.uploadSnapshot({
      buildId,
      image: { path: './fixtures/sauce-test-results.png' },
      dom: { path: './fixtures/sauce-test-results.html' },
    });
    await api.createSnapshot({
      buildUuid: buildId,
      uploadUuid: uploadId,
      name: 'Test Snapshot',
      operatingSystem: metaInfo?.operatingSystem ?? null,
      operatingSystemVersion: metaInfo?.operatingSystemVersion ?? null,
      browser: metaInfo?.browser ?? null,
      browserVersion: metaInfo?.browserVersion ?? null,
      suiteName: null,
      testName: null,
      ignoreRegions: null,
      device: null,
      diffingMethod: null,
    });

    await api.finishBuild({ id: buildId });
  },
  60 * 1000,
);
