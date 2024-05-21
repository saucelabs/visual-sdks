import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getApi as getVisualApi, waitForBuildResult } from './api';
import * as utils from './utils';
import * as sauceVisual from '@saucelabs/visual';
import { BuildStatus, getApi } from '@saucelabs/visual';
import { MockInstance } from 'jest-mock';

jest.mock('@saucelabs/visual', () => ({
  ...jest.requireActual<typeof sauceVisual>('@saucelabs/visual'),
  getApi: () => ({
    buildStatus: jest.fn(),
  }),
}));

describe('api', () => {
  jest.spyOn(utils, 'getOpts').mockReturnValue(utils.getEnvOpts());
  const consoleInfoSpy = jest
    .spyOn(console, 'info')
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    .mockImplementation(() => {});
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    .mockImplementation(() => {});
  const apiMock = getVisualApi();
  const buildStatusSpy = apiMock.buildStatus as unknown as MockInstance<
    ReturnType<typeof getApi>['buildStatus']
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const fakeBuild: Awaited<
    ReturnType<ReturnType<typeof getApi>['buildStatus']>
  > = {
    __typename: 'Build',
    status: BuildStatus.Running,
    url: 'https://fake-url',
    unapprovedCount: 0,
  };

  describe('waitForBuildResult', () => {
    it('should log a console error when a build is not found, and only query the API once', async () => {
      buildStatusSpy.mockResolvedValue(null);
      await waitForBuildResult('');
      expect(buildStatusSpy).toBeCalledTimes(1);
      expect(consoleErrorSpy).toBeCalledTimes(1);
      expect(consoleErrorSpy).toBeCalledWith(
        expect.stringContaining(
          'Build has been deleted or you do not have access to view it',
        ),
      );
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
      await waitForBuildResult('');
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
      await waitForBuildResult('');

      // Should retry as many times as buildstatus === running
      expect(buildStatusSpy).toBeCalledTimes(3);
    });

    it('should log a successful build attempt with console info', async () => {
      buildStatusSpy.mockResolvedValue({
        ...fakeBuild,
        status: BuildStatus.Equal,
      });
      await waitForBuildResult('');

      // Should retry as many times as buildstatus === running
      expect(buildStatusSpy).toBeCalledTimes(1);
      expect(consoleInfoSpy).toBeCalledTimes(1);
      expect(consoleInfoSpy).toBeCalledWith(
        expect.stringContaining(fakeBuild.url),
      );
    });
  });
});
