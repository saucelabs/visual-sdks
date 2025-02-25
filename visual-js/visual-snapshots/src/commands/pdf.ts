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
import { PdfCommandHandler, PdfCommandParams } from "../app/pdf-handler.js";

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
    .action((pdfFilePath: string, params: PdfCommandParams) => {
      new PdfCommandHandler()
        .handle(pdfFilePath, params)
        .then(() => {
          console.log("Successfully created PDF snapshots");
        })
        .catch((err) => {
          console.error(`An error occured when creating PDF snapshots: ${err}`);
        });
    });
};
