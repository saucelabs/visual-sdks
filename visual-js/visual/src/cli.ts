#!/usr/bin/env node
import { Command, Option, program } from 'commander';

import chalk from 'chalk';
import {
  buildIdOption,
  buildStatusCommand,
  command as buildCommand,
  customIdOption,
  options as buildOptions,
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
const regionOption = new Option(
  '-r, --region <region>',
  'The Sauce Labs region. Options: us-west-1, eu-central-1 (Default: "us-west-1)"',
)
  .argParser(regionParser)
  .default(VisualApiRegion.fromName('us-west-1'));

const defaultCommand = new Command()
  .name('default')
  .addOption(buildIdOption)
  .addOption(customIdOption)
  .action(async (...args: Parameters<typeof buildStatusCommand>) => {
    console.warn(
      chalk.bold(
        chalk.redBright(
          `This command is deprecated. Please use "visual build status" instead of "visual"`,
        ),
      ),
    );
    await buildStatusCommand(...args);
  });

program.name('visual').description('Interacts with Sauce Visual');
program.addOption(regionOption);
program.addCommand(defaultCommand, { isDefault: true, hidden: true });
program.addCommand(buildCommand(), buildOptions);

(async function () {
  try {
    program.parse();
  } catch (e) {
    console.error(`${e}`);
    process.exit(1);
  }
})();
