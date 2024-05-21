import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Command } from 'commander';
import { BuildStatus } from '../graphql/__generated__/graphql';
import { VisualApiRegion } from '../regions';

jest.unstable_mockModule('../api', () => ({
  getApi: jest.fn().mockReturnValue({
    createBuild: jest.fn(),
    finishBuild: jest.fn(),
    buildWithDiffsByCustomId: jest.fn(),
    buildWithDiffs: jest.fn(),
  }),
}));

const api = await import('../api');
const { command } = await import('./build');

const makeProgram = () => {
  return new Command().exitOverride().name('visual').addCommand(command());
};

// @ts-expect-error mock - prevent processes exiting during tests
// eslint-disable-next-line @typescript-eslint/no-empty-function
jest.spyOn(process, 'exit').mockImplementation(() => {});

const errorSpy = jest.spyOn(process.stderr, 'write');

beforeEach(() => {
  errorSpy.mockClear();
});

describe('build create', () => {
  const createSpy = jest
    .spyOn(api.getApi({}), 'createBuild')
    .mockResolvedValue({
      branch: null,
      defaultBranch: null,
      name: '',
      project: null,
      status: BuildStatus.Running,
      url: '',
      id: '1234',
    });

  beforeEach(() => {
    (api.getApi as unknown as jest.Mock).mockClear();
    createSpy.mockClear();
    errorSpy.mockClear();
  });

  it('should parse a valid call with required "name"', () => {
    makeProgram().parse('npx visual build create --name test_build'.split(' '));
    expect(createSpy).toBeCalled();
  });

  it('should throw an error when name is omitted', () => {
    makeProgram().parse('npx visual build create'.split(' '));
    expect(errorSpy).toBeCalledWith(
      expect.stringMatching(/required option .* not specified/),
    );
  });

  it('should parse all options', () => {
    makeProgram().parse(
      'npx visual build create --name test_build --project project_name --branch branch_name --custom-id 12345'.split(
        ' ',
      ),
    );
    expect(createSpy).toBeCalledWith({
      name: 'test_build',
      project: 'project_name',
      branch: 'branch_name',
      customId: '12345',
    });
  });

  it('should pass the region to the getApi call', () => {
    makeProgram().parse(
      'npx visual build create --name test_build --region eu-central-1'.split(
        ' ',
      ),
    );
    expect(api.getApi).toBeCalledWith(
      expect.objectContaining({
        region: VisualApiRegion.fromName('eu-central-1'),
      }),
    );
  });
});

describe('build finish', () => {
  const finishSpy = jest
    .spyOn(api.getApi({}), 'finishBuild')
    .mockResolvedValue({
      name: '',
      status: BuildStatus.Equal,
      url: '',
      id: '1234',
    });

  beforeEach(() => {
    (api.getApi as unknown as jest.Mock).mockClear();
    finishSpy.mockClear();
    errorSpy.mockClear();
  });

  it('should parse a valid call with required "build-id"', () => {
    makeProgram().parse('npx visual build finish --build-id 1234'.split(' '));
    expect(finishSpy).toBeCalledWith({ uuid: '1234' });
  });

  it('should throw if neither a build id or custom id not provided', () => {
    makeProgram().parse('npx visual build finish'.split(' '));
    expect(errorSpy).toBeCalledWith(
      expect.stringMatching(/--build-id or --custom-id needs to be specified/),
    );
  });
});

describe('build status', () => {
  const statusSpy = jest
    .spyOn(api.getApi({}), 'buildWithDiffs')
    .mockResolvedValue({
      __typename: 'Build',
      id: '1234',
      name: '',
      status: BuildStatus.Equal,
      project: '',
      url: '',
      branch: null,
      diffs: {
        nodes: [],
      },
    });

  beforeEach(() => {
    (api.getApi as unknown as jest.Mock).mockClear();
    statusSpy.mockClear();
  });

  it('should parse a valid call with required "build-id"', () => {
    makeProgram().parse('npx visual build status --build-id 1234'.split(' '));
    expect(statusSpy).toBeCalledWith('1234');
  });

  it('should throw if neither a build id or custom id not provided', () => {
    makeProgram().parse('npx visual build status'.split(' '));
    expect(errorSpy).toBeCalledWith(
      expect.stringMatching(/--build-id or --custom-id needs to be specified/),
    );
  });
});
