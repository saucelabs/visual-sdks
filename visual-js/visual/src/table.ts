import chalk from 'chalk';
import Table from 'cli-table3';
import { DiffStatus } from './api.js';

const STATUS_ORDER: { colorize: (s: string) => string; statusName: string }[] =
  [
    {
      statusName: DiffStatus.Approved,
      colorize: (s) => chalk.green(s),
    },
    {
      statusName: DiffStatus.Equal,
      colorize: (s) => chalk.green(s),
    },
    {
      statusName: DiffStatus.Queued,
      colorize: (s) => chalk.blueBright(s),
    },
    {
      statusName: DiffStatus.Unapproved,
      colorize: (s) => chalk.redBright(s),
    },
    {
      statusName: DiffStatus.Rejected,
      colorize: (s) => chalk.redBright(s),
    },
  ];

function capitalize(s: string): string {
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

export function displayStatusTable(
  buildId: string,
  status: { [key: string]: number },
) {
  console.log(`Results for build ${buildId}:\n`);
  const table = new Table({
    head: [chalk.reset('Count'), chalk.reset('Status')],
  });
  STATUS_ORDER.forEach((s) =>
    table.push([
      status[s.statusName] ?? 0,
      s.colorize(capitalize(s.statusName)),
    ]),
  );
  const unkownCount = Object.entries(status)
    .filter(
      ([statusName, _]) =>
        !STATUS_ORDER.map((s) => s.statusName).includes(statusName),
    )
    .map(([_, count]) => count)
    .reduce((p, n) => p + n, 0);
  if (unkownCount) {
    table.push([unkownCount, 'Unknown']);
  }
  console.log(table.toString());
}
