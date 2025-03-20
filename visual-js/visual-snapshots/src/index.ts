#! /usr/bin/env node

import { Command } from "commander";
import { pdfCommand } from "./commands/pdf.js";
import { clientVersion } from "./version.js";

const program = new Command();

program
  .name("visual-snapshots")
  .description("Create visual snapshots of a document.")
  .version(clientVersion);

program.addCommand(pdfCommand(clientVersion));

program.parse();
