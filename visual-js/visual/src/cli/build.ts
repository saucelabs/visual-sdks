import { Command, CommandOptions, Option, program } from 'commander';
import { VisualApiRegion } from '../regions';
import { VisualApi, getApi } from '../api';
import { displayStatusTable } from '../table';
import { DiffStatus } from '../graphql/__generated__/graphql';

/**
 * Utils
 */
const defaultRegion = VisualApiRegion.fromName('us-west-1');

const hasBuildIdOrCustomId = (args: {
  customId?: string;
  buildId?: string;
}) => {
  if (args.buildId && args.customId) {
    program.error(
      'Error: only one of --build-id or --custom-id can be specified',
    );
  }
  if (!args.buildId && !args.customId) {
    program.error('Error: --build-id or --custom-id needs to be specified');
  }
};

const regionParser = (
  input: string,
  _previous: VisualApiRegion,
): VisualApiRegion => {
  if (!input) {
    return VisualApiRegion.fromName('us-west-1');
  }
  try {
    return VisualApiRegion.fromName(input);
  } catch (e: unknown) {
    program.error(String(e));
  }
};

/**
 * Common options
 */
export const buildIdOption: Option = new Option('-b, --build-id <build-id>');
export const customIdOption: Option = new Option('-c, --custom-id <custom-id>');
export const regionOption = new Option(
  '-r, --region <region>',
  'The Sauce Labs region. Options: us-west-1, eu-central-1 (Default: "us-west-1)"',
).argParser(regionParser);

/**
 * Functions for visual status
 */
const SUCCESS_STATUS: string[] = [DiffStatus.Approved, DiffStatus.Equal];

const getBuildResults = async (
  api: VisualApi,
  { buildId, customId }: { buildId?: string; customId?: string },
): Promise<Record<string, number>> => {
  const getBuild = async () => {
    if (customId) return api.buildWithDiffsByCustomId(customId);
    if (buildId) return api.buildWithDiffs(buildId);
    return null;
  };

  const build = await getBuild();

  if (!build) {
    throw new Error(`no build with matching criteria has been found`);
  }

  return build.diffs.nodes
    .map((d) => d.status)
    .reduce((r: Record<string, number>, s: DiffStatus) => {
      r[s] = (r[s] ?? 0) + 1;
      return r;
    }, {});
};

export const buildStatusCommand = async (
  options: BuildStatusCommandOptions,
) => {
  hasBuildIdOrCustomId(options);

  const visualApi = getApi({
    region: options.region || defaultRegion,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
  });

  const status = await getBuildResults(visualApi, options);
  displayStatusTable(options.buildId || options.customId || '', status);

  const failures = Object.entries(status)
    .filter(([state]) => !SUCCESS_STATUS.includes(state))
    .map(([_, count]) => count)
    .reduce((prev, cur) => prev + cur, 0);

  process.exit(failures ? 1 : 0);
};

/**
 * command: visual build status
 */
type BuildStatusCommandOptions = {
  buildId?: string;
  customId?: string;
  region?: VisualApiRegion;
};
const statusCommand = () =>
  new Command()
    .name('status')
    .description('Fetches status from a Sauce Visual build')
    .addOption(buildIdOption)
    .addOption(customIdOption)
    .addOption(regionOption)
    .action(buildStatusCommand);

/**
 * Functions for build create
 */
export const buildCreate = async (options: BuildCreateCommandOptions) => {
  const visualApi = getApi({
    region: options.region || defaultRegion,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
  });

  const build = await visualApi.createBuild({
    name: options.name,
    branch: options.branch,
    customId: options.customId,
    project: options.project,
    defaultBranch: options.defaultBranch,
  });
  console.info(`Build ${build.id} created`);
};

/**
 * command: visual build create
 */
type BuildCreateCommandOptions = {
  region?: VisualApiRegion;
  name: string;
  branch?: string;
  customId?: string;
  project?: string;
  defaultBranch?: string;
};
const buildCreateCommand = () =>
  new Command()
    .name('create')
    .description('Creates a Sauce Visual build')
    .requiredOption('-n, --name <name>')
    .addOption(customIdOption)
    .addOption(regionOption)
    .option('--branch <branch>')
    .option('--default-branch <defaultBranch>')
    .option('-p, --project <project>')
    .action(buildCreate);

/**
 * Functions for build finish
 */
export const buildFinish = async (options: BuildFinishCommandOptions) => {
  hasBuildIdOrCustomId(options);

  const visualApi = getApi({
    region: options.region || defaultRegion,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
  });

  let { buildId } = options;

  const { customId } = options;
  if (!buildId && customId) {
    const build = await visualApi.buildByCustomId(customId);
    if (!build) {
      program.error(`customId '${customId}' does not resolve to a build`);
    }
    buildId = build.id;
  }

  await visualApi.finishBuild({ uuid: buildId });
};

/**
 * command: visual build finish
 */
type BuildFinishCommandOptions = {
  customId?: string;
  buildId?: string;
  region?: VisualApiRegion;
};
const buildFinishCommand = () =>
  new Command()
    .name('finish')
    .description('Finishes a Sauce Visual build')
    .addOption(buildIdOption)
    .addOption(customIdOption)
    .addOption(regionOption)
    .action(buildFinish);

/**
 * command: visual build
 */
export const options: CommandOptions = {
  hidden: false,
  isDefault: false,
};
export const command = () =>
  new Command()
    .name('build')
    .description('Interacts with a Sauce Visual build')
    .addCommand(statusCommand())
    .addCommand(buildCreateCommand())
    .addCommand(buildFinishCommand());
