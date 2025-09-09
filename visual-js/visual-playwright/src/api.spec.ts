import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { MockInstance } from 'jest-mock';
import * as sauceVisual from '@saucelabs/visual';
import { BuildStatus, getEnvOpts, VisualApi } from '@saucelabs/visual';
import VisualPlaywright from './api';
import * as utils from './utils';

jest.mock('@saucelabs/visual', () => {
  const apiResult = {
    buildStatus: jest.fn(),
  };
  return {
    ...jest.requireActual<typeof sauceVisual>('@saucelabs/visual'),
    getApi: () => apiResult,
  };
});

describe('api', () => {
  const exitSpy = jest
    .spyOn(process, 'exitCode', 'set')
    .mockImplementation(() => {
      //
    });
  const consoleInfoSpy = jest
    .spyOn(console, 'info')
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    .mockImplementation(() => {});
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    .mockImplementation(() => {});
  jest.spyOn(utils, 'getOpts').mockReturnValue({
    ...getEnvOpts(),
    externalBuildId: true,
  });
  const buildStatusSpy = VisualPlaywright.api
    .buildStatus as unknown as MockInstance<VisualApi['buildStatus']>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const fakeBuild: Awaited<ReturnType<VisualApi['buildStatus']>> = {
    __typename: 'Build',
    status: BuildStatus.Running,
    url: 'https://fake-url',
    unapprovedCount: 0,
    errorCount: 0,
  };

  describe('waitForBuildResult', () => {
    it('should log a console error when a build is not found, and only query the API once', async () => {
      buildStatusSpy.mockResolvedValue(null);
      await VisualPlaywright.waitForBuildResult('');
      expect(buildStatusSpy).toBeCalledTimes(1);
      expect(consoleErrorSpy).toBeCalledTimes(1);
      expect(consoleErrorSpy).toBeCalledWith(
        expect.stringContaining(
          'Build has been deleted or you do not have access to view it',
        ),
      );
      expect(exitSpy).toBeCalledWith(1);
    });

    it('should retry if an exception is thrown from the api', async () => {
      buildStatusSpy
        .mockImplementationOnce(async () => {
          throw new Error();
        })
        .mockResolvedValueOnce({
          ...fakeBuild,
          status: BuildStatus.Equal,
        });
      await VisualPlaywright.waitForBuildResult('');
      expect(buildStatusSpy).toBeCalledTimes(2);
      expect(consoleInfoSpy).toBeCalledTimes(1);
      expect(consoleInfoSpy).toBeCalledWith(
        expect.stringContaining(fakeBuild.url),
      );
    });

    it('should retry when a build is still running', async () => {
      buildStatusSpy
        .mockResolvedValueOnce({
          ...fakeBuild,
          status: BuildStatus.Running,
        })
        .mockResolvedValueOnce({
          ...fakeBuild,
          status: BuildStatus.Running,
        })
        .mockResolvedValue({
          ...fakeBuild,
          status: BuildStatus.Unapproved,
        });
      await VisualPlaywright.waitForBuildResult('');

      // Should retry as many times as buildstatus === running
      expect(buildStatusSpy).toBeCalledTimes(3);
    });

    it('should log a successful build attempt with console info', async () => {
      buildStatusSpy.mockResolvedValue({
        ...fakeBuild,
        status: BuildStatus.Equal,
      });
      await VisualPlaywright.waitForBuildResult('');

      // Should retry as many times as buildstatus === running
      expect(buildStatusSpy).toBeCalledTimes(1);
      expect(consoleInfoSpy).toBeCalledTimes(1);
      expect(consoleInfoSpy).toBeCalledWith(
        expect.stringContaining(fakeBuild.url),
      );
    });
  });
});
