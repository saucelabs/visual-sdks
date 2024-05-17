import chalk from 'chalk';

export function screenshotSectionStart() {
  return `  Sauce Labs Visual`;
}

export function buildUrl(
  url: string,
  options: { reviewReady: boolean } = { reviewReady: false },
): string {
  const extraLine = options.reviewReady
    ? `  ${chalk.grey(chalk.italic('You can now review your changes'))}\n`
    : '';

  return `
${chalk.grey(''.padStart(100, '-'))}

  ${chalk.underline(chalk.bold(chalk.yellow('Sauce Labs Visual:')))}
${extraLine}
${chalk.white(url.padStart(100, ' '))}
`;
}
