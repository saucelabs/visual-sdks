import { Command, CommandOptions } from 'commander';
import { VisualApiRegion } from '../regions';
import { VisualApi, getApi } from '../api';

function apiFromOptions(opts: { region: VisualApiRegion }): VisualApi {
  return getApi({
    region: opts.region,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
  });
}

type BuildStatusCommandOptions = {
  project: string;
  sourceBranch: string;
  targetBranch: string;
  region: VisualApiRegion;
};
export async function baselineMergeCommand(_: unknown, cmd: Command) {
  const options = cmd.optsWithGlobals<BuildStatusCommandOptions>();

  const visualApi = apiFromOptions(options);
  const result = await visualApi.mergeBaselines({
    projectName: options.project,
    ...options,
  });
  console.log(`Merged baselines: ${result.baselines?.length}`);
}

const mergeCommand = () =>
  new Command()
    .name('merge')
    .description('Merge baselines from a source branch into a target branch')
    .requiredOption('-p, --project', 'Project name')
    .requiredOption(
      '-s, --source-branch',
      'Branch from which to copy the baselines',
    )
    .requiredOption(
      '-t, --target-branch',
      'Branch into which copy the baselines',
    )
    .action(baselineMergeCommand);

/**
 * command: visual baselines
 */
export const options: CommandOptions = {
  hidden: false,
  isDefault: false,
};
export const command = () =>
  new Command()
    .name('baselines')
    .description('Interacts with Sauce Visual baselines')
    .addCommand(mergeCommand());
