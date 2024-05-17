#!/usr/bin/env node

import { Command, program } from 'commander';
import chalk from 'chalk';
import {
  buildIdOption,
  buildStatusCommand,
  command as buildCommand,
  customIdOption,
  options as buildOptions,
} from './cli/build.js';

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
