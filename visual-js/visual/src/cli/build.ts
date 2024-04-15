import { Command, CommandOptions, Option, program } from 'commander';
import { VisualApiRegion } from '../regions.js';
import { VisualApi, DiffStatus, getApi } from '../api.js';
import { displayStatusTable } from '../table.js';

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
  const build = customId
    ? await api.buildWithDiffsByCustomId(customId)
    : await api.buildWithDiffs(buildId);
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

export const buildStatusCommand = async () => {
  const options: BuildStatusCommandOptions = program.opts();

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
const statusCommand: Command = new Command()
  .name('status')
  .description('Fetches status from a Sauce Visual build')
  .addOption(buildIdOption)
  .addOption(customIdOption)
  .action(buildStatusCommand);

/**
 * Functions for build create
 */
export const buildCreate = async (args: { name: string }) => {
  const options: BuildCreateCommandOptions = program.opts();

  const visualApi = getApi({
    region: options.region || defaultRegion,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
  });

  const build = await visualApi.createBuild({
    name: args.name,
    branch: options.branch,
    customId: options.customId,
    project: options.project,
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
};
const buildCreateCommand: Command = new Command()
  .name('create')
  .description('Creates a Sauce Visual build')
  .requiredOption('-n, --name <name>')
  .addOption(customIdOption)
  .option('--branch <branch>')
  .option('-p, --project <project>')
  .action(buildCreate);

/**
 * Functions for build finish
 */
export const buildFinish = async () => {
  const options: BuildFinishCommandOptions = program.opts();

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
const buildFinishCommand: Command = new Command()
  .name('finish')
  .description('Finishes a Sauce Visual build')
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
export const command: Command = new Command()
  .name('build')
  .description('Interacts with a Sauce Visual build')
  .addCommand(statusCommand)
  .addCommand(buildCreateCommand)
  .addCommand(buildFinishCommand);
