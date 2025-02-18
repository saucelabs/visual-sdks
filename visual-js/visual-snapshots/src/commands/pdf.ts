import { Command } from "commander";
import {
  accessKeyOption,
  branchOption,
  buildIdOption,
  buildNameOption,
  customIdOption,
  defaultBranchOption,
  projectOption,
  regionOption,
  usernameOption,
} from "./options.js";

export const pdfCommand = () => {
  return new Command()
    .name("pdf")
    .description("Create visual snapshots for each page of a PDF file")
    .argument("<pdf-file-path>", "A path to a PDF file")
    .addOption(usernameOption)
    .addOption(accessKeyOption)
    .addOption(regionOption)
    .addOption(buildNameOption)
    .addOption(branchOption)
    .addOption(defaultBranchOption)
    .addOption(projectOption)
    .addOption(buildIdOption)
    .addOption(customIdOption)
    .action((pdfFilePath: string, options: Record<string, string>) => {
      console.info(
        `Create snapshots of a pdf file: '${pdfFilePath}' with options: ${Object.entries(options)}`,
      );
    });
};
