#! /usr/bin/env node

import { Command } from "commander";
import { pdfCommand } from "./commands/pdf.js";
import { clientVersion } from "./version.js";
import { loggerLevel } from "./commands/options.js";
import pino from "pino";
import { logger } from "./logger.js";

const program = new Command();

program
  .name("visual-snapshots")
  .description("Create visual snapshots of a document.")
  .version(clientVersion)
  .addOption(loggerLevel);

program.addCommand(pdfCommand(clientVersion));

program.on("option:log", (level: pino.Level) => {
  logger.level = level;
});

program.parse();
