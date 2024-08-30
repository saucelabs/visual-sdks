import { Command, CommandOptions } from 'commander';
import { VisualApiRegion } from '../common/regions';
import { VisualApi, getApi } from '../common/api';
import { regionOption } from './common-options';

function apiFromOptions(opts: { region: VisualApiRegion }): VisualApi {
  return getApi({
    region: opts.region,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
  });
}

type BaselineMergeCommandOptions = {
  project: string;
  sourceBranch: string;
  targetBranch: string;
  region: VisualApiRegion;
};
export async function baselineMergeCommand(_: unknown, cmd: Command) {
  const options = cmd.optsWithGlobals<BaselineMergeCommandOptions>();

  const visualApi = apiFromOptions(options);
  const result = await visualApi.mergeBaselines({
    projectName: options.project,
    sourceBranch: options.sourceBranch,
    targetBranch: options.targetBranch,
  });
  console.log(`Merged baselines: ${result.baselines?.length}`);
}

const mergeCommand = () =>
  new Command()
    .name('merge')
    .description('Merge baselines from a source branch into a target branch')
    .addOption(regionOption)
    .requiredOption('-p, --project <project>', 'Project name')
    .requiredOption(
      '-s, --source-branch <branch>',
      'Branch from which to copy the baselines',
    )
    .requiredOption(
      '-t, --target-branch <branch>',
      'Branch into which to copy the baselines',
    )
    .action(baselineMergeCommand);

/**
 * command: visual baselines
 */
export const baselinesOptions: CommandOptions = {};
export const baselinesCommand = () =>
  new Command()
    .name('baselines')
    .description('Interacts with Sauce Visual baselines')
    .addCommand(mergeCommand());
