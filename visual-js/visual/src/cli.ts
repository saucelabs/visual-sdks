#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import {
  command as buildCommand,
  buildIdOption,
  options as buildOptions,
  buildStatusCommand,
  customIdOption,
} from './cli/build.js';
import { VisualApiRegion } from './regions.js';

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

program
  .name('visual')
  .description('Interacts with Sauce Visual')
  .option<VisualApiRegion>(
    '-r, --region <region>',
    'The Sauce Labs region. Options: us-west-1, eu-central-1 (Default: "us-west-1)"',
    regionParser,
  )
  // Implementation for legacy command-line
  .addOption(buildIdOption)
  .addOption(customIdOption)
  .action(async () => {
    console.warn(
      chalk.bold(
        chalk.redBright(
          `This command is deprecated. Please use "visual build status" instead of "visual"`,
        ),
      ),
    );
    await buildStatusCommand();
  });

program.addCommand(buildCommand, buildOptions);

(async function () {
  try {
    program.parse();
  } catch (e) {
    console.error(`${e}`);
    process.exit(1);
  }
})();
