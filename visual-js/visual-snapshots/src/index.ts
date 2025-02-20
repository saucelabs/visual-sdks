#! /usr/bin/env node

import { Command } from "commander";
import { pdfCommand } from "./commands/pdf.js";

const program = new Command();

program
  .name("visual-snapshots")
  .description("Create visual snapshots of a document.")
  .version("0.1.0");

program.addCommand(pdfCommand());

program.parse();
