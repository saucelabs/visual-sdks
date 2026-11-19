import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { MockInstance } from 'jest-mock';
import * as sauceVisual from '@saucelabs/visual';
import {
  BuildMode,
  BuildStatus,
  getEnvOpts,
  VisualApi,
} from '@saucelabs/visual';
import VisualPlaywright from './api';
import * as utils from './utils';

jest.mock('@saucelabs/visual', () => {
  const apiResult = {
    buildStatus: jest.fn(),
    build: jest.fn(),
    buildByCustomId: jest.fn(),
    createBuild: jest.fn(),
    finishBuild: jest.fn(),
    domCaptureScript: jest.fn(),
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
  const defaultOpts = {
    ...getEnvOpts(),
    externalBuildId: true,
  };
  const getOptsSpy = jest.spyOn(utils, 'getOpts').mockReturnValue(defaultOpts);
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

  describe('setup', () => {
    const api = VisualPlaywright.api as unknown as Record<
      'build' | 'buildByCustomId' | 'createBuild' | 'finishBuild',
      jest.Mock<(...args: unknown[]) => Promise<unknown>>
    >;
    const completedMsg =
      'cannot add more screenshots since the build is already completed';
    const withOpts = (opts: Partial<typeof defaultOpts>) =>
      getOptsSpy.mockReturnValue({ ...defaultOpts, ...opts });
    const setOptsSpy = jest
      .spyOn(utils, 'setOpts')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    afterEach(() => {
      getOptsSpy.mockReturnValue(defaultOpts);
    });

    it('refuses a completed build passed by buildId', async () => {
      withOpts({ buildId: 'build-1', customId: null });
      api.build.mockResolvedValue({ id: 'build-1', mode: BuildMode.Completed });

      await expect(VisualPlaywright.setup()).rejects.toThrow(completedMsg);
      expect(api.build).toBeCalledWith('build-1');
      expect(api.createBuild).not.toBeCalled();
    });

    it('joins a running build passed by buildId', async () => {
      withOpts({ buildId: 'build-1', customId: null });
      api.build.mockResolvedValue({ id: 'build-1', mode: BuildMode.Running });

      await VisualPlaywright.setup();
      expect(api.createBuild).not.toBeCalled();
    });

    it('refuses a completed build found by customId', async () => {
      withOpts({ buildId: null, customId: 'my-custom-id' });
      api.buildByCustomId.mockResolvedValue({
        id: 'build-2',
        mode: BuildMode.Completed,
      });

      await expect(VisualPlaywright.setup()).rejects.toThrow(completedMsg);
      expect(api.buildByCustomId).toBeCalledWith('my-custom-id');
      expect(api.createBuild).not.toBeCalled();
    });

    it('joins a running build found by customId as an external build', async () => {
      withOpts({ buildId: null, customId: 'my-custom-id' });
      api.buildByCustomId.mockResolvedValue({
        id: 'build-2',
        mode: BuildMode.Running,
      });

      await VisualPlaywright.setup();
      expect(api.createBuild).not.toBeCalled();
      expect(setOptsSpy).toBeCalledWith({
        buildId: 'build-2',
        externalBuildId: true,
      });
    });

    it('creates a build when the customId has none yet', async () => {
      withOpts({ buildId: null, customId: 'new-custom-id' });
      api.buildByCustomId.mockResolvedValue(null);
      api.createBuild.mockResolvedValue({ id: 'build-3', url: 'url' });

      await VisualPlaywright.setup();
      expect(api.createBuild).toBeCalledWith(
        expect.objectContaining({ customId: 'new-custom-id' }),
      );
      expect(setOptsSpy).toBeCalledWith({
        buildId: 'build-3',
        externalBuildId: false,
      });
    });

    describe('buildFinishDelay', () => {
      it('creates the build for its customId instead of joining it', async () => {
        withOpts({
          buildId: null,
          customId: 'shared-id',
          buildFinishDelay: 30,
        });
        api.createBuild.mockResolvedValue({ id: 'build-4', url: 'url' });

        await VisualPlaywright.setup();
        expect(api.buildByCustomId).not.toBeCalled();
        expect(api.createBuild).toBeCalledWith(
          expect.objectContaining({ customId: 'shared-id' }),
        );
        expect(setOptsSpy).toBeCalledWith({
          buildId: 'build-4',
          externalBuildId: false,
        });
      });

      it('requires a customId', async () => {
        withOpts({ buildId: null, customId: null, buildFinishDelay: 30 });

        await expect(VisualPlaywright.setup()).rejects.toThrow(
          'buildFinishDelay requires a customId',
        );
        expect(api.createBuild).not.toBeCalled();
      });

      it('rejects a negative delay', async () => {
        withOpts({
          buildId: null,
          customId: 'shared-id',
          buildFinishDelay: -5,
        });

        await expect(VisualPlaywright.setup()).rejects.toThrow(
          'non-negative whole number of seconds',
        );
      });

      it('finishes the build with the delay and does not wait for its result', async () => {
        withOpts({
          buildId: 'build-4',
          externalBuildId: false,
          customId: 'shared-id',
          buildFinishDelay: 30,
        });
        api.finishBuild.mockResolvedValue({ id: 'build-4', url: 'url' });

        await VisualPlaywright.teardown();
        expect(api.finishBuild).toBeCalledWith({ uuid: 'build-4', delay: 30 });
        expect(buildStatusSpy).not.toBeCalled();
      });

      it('finishes without a delay and waits for the result when unset', async () => {
        withOpts({ buildId: 'build-5', externalBuildId: false });
        api.finishBuild.mockResolvedValue({ id: 'build-5', url: 'url' });
        buildStatusSpy.mockResolvedValue({
          ...fakeBuild,
          status: BuildStatus.Equal,
        });

        await VisualPlaywright.teardown();
        expect(api.finishBuild).toBeCalledWith({
          uuid: 'build-5',
          delay: undefined,
        });
        expect(buildStatusSpy).toBeCalledTimes(1);
      });
    });
  });
});
