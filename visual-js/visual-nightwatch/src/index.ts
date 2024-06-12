import chalk from 'chalk';
import 'nightwatch';
import { DiffingMethod, DiffStatus, Ignorable } from '@saucelabs/visual';
import { Awaitable } from 'nightwatch';
import { CheckOptions } from './types';

console.log(
  `\n${chalk.yellow('Loaded @saucelabs/nightwatch-sauce-visual-service')}\n`,
);

export { DiffStatus, CheckOptions, Ignorable, DiffingMethod };

declare module 'nightwatch' {
  interface NightwatchAssertions<ReturnType> {
    sauceVisualResults: (
      diffStatus: DiffStatus,
      expected: number,
    ) => ReturnType;
  }

  interface NightwatchCustomCommands {
    sauceVisualCheck(
      name: string,
      options?: CheckOptions,
    ): Awaitable<this, void>;
  }
}
