import { Command, CommandOptions, Option, program } from 'commander';
import { VisualApiRegion } from '../common/regions';
import { VisualApi, getApi } from '../common/api';
import { displayStatusTable } from '../common/table';
import { DiffStatus } from '../graphql/__generated__/graphql';
import { regionOption } from './common-options';

/**
 * Utils
 */
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

function apiFromOptions(opts: { region: VisualApiRegion }): VisualApi {
  return getApi({
    region: opts.region,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
  });
}

/**
 * Common options
 */
export const buildIdOption: Option = new Option('-b, --build-id <build-id>');
export const customIdOption: Option = new Option('-c, --custom-id <custom-id>');

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

export const buildStatusCommand = async (_: unknown, cmd: Command) => {
  const options = cmd.optsWithGlobals<BuildStatusCommandOptions>();

  hasBuildIdOrCustomId(options);

  const visualApi = apiFromOptions(options);

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
  region: VisualApiRegion;
};
const statusCommand = () =>
  new Command()
    .name('status')
    .description('Fetches status from a Sauce Visual build')
    .addOption(regionOption)
    .addOption(buildIdOption)
    .addOption(customIdOption)
    .action(buildStatusCommand);

/**
 * Functions for build create
 */
export const buildCreate = async (_: unknown, cmd: Command) => {
  const options = cmd.optsWithGlobals<BuildCreateCommandOptions>();

  const visualApi = apiFromOptions(options);

  const build = await visualApi.createBuild({
    name: options.name,
    branch: options.branch,
    customId: options.customId,
    project: options.project,
    defaultBranch: options.defaultBranch,
  });
  console.info(`Build ${build.id} created`);
  if (options.url === true) {
    console.info(`URL: ${build.url}`);
  }
};

/**
 * command: visual build create
 */
type BuildCreateCommandOptions = {
  region: VisualApiRegion;
  name: string;
  branch?: string;
  customId?: string;
  url?: boolean;
  project?: string;
  defaultBranch?: string;
};
const buildCreateCommand = () =>
  new Command()
    .name('create')
    .description('Creates a Sauce Visual build')
    .addOption(regionOption)
    .requiredOption('-n, --name <name>')
    .addOption(customIdOption)
    .option('--branch <branch>')
    .option('--default-branch <defaultBranch>')
    .option('-p, --project <project>')
    .option('-u, --url')
    .action(buildCreate);

/**
 * Functions for build finish
 */
export const buildFinish = async (_: unknown, cmd: Command) => {
  const options = cmd.optsWithGlobals<BuildFinishCommandOptions>();

  hasBuildIdOrCustomId(options);

  const visualApi = apiFromOptions(options);

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
  region: VisualApiRegion;
};
const buildFinishCommand = () =>
  new Command()
    .name('finish')
    .description('Finishes a Sauce Visual build')
    .addOption(regionOption)
    .addOption(buildIdOption)
    .addOption(customIdOption)
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
