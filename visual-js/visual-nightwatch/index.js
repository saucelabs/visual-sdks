const chalk = require('chalk');
const { DiffStatus } = require('@saucelabs/visual');

console.log(
  `\n${chalk.yellow('Loaded @saucelabs/nightwatch-sauce-visual-service')}\n`,
);

module.exports.DiffStatus = DiffStatus;
