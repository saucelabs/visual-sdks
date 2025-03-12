import { Command, Option } from "commander";
import {
  accessKeyOption,
  branchOption,
  buildIdOption,
  buildNameOption,
  customIdOption,
  defaultBranchOption,
  projectOption,
  regionOption,
  suiteNameOption,
  usernameOption,
} from "./options.js";
import { PdfCommandHandler, PdfCommandParams } from "../app/pdf-handler.js";
import { EOL } from "os";

export const testNameOption = new Option(
  "--test-name <test-name>",
  "The name of the test you would like to appear in the Sauce Visual dashboard." +
    EOL +
    "Supports the following parameters: {filename}"
);

export const snapshotNameOption = new Option(
  "--snapshot-name <snapshot-name>",
  "The name of the snapshot you would like to appear in the Sauce Visual dashboard." +
    EOL +
    " Supports the following parameters: {filename}, {page}"
);

export const pdfCommand = (clientVersion: string) => {
  return new Command()
    .name("pdf")
    .description("Create visual snapshots for each page of a PDF file")
    .argument(
      "<paths, globs, dirs...>",
      "Paths to PDF files, glob patterns, or paths to directories containing PDF files."
    )
    .addOption(usernameOption)
    .addOption(accessKeyOption)
    .addOption(regionOption)
    .addOption(buildNameOption)
    .addOption(branchOption)
    .addOption(defaultBranchOption)
    .addOption(projectOption)
    .addOption(buildIdOption)
    .addOption(customIdOption)
    .addOption(suiteNameOption)
    .addOption(testNameOption)
    .addOption(snapshotNameOption)
    .action((globsOrDirs: string[], params: PdfCommandParams) => {
      new PdfCommandHandler(clientVersion)
        .handle(globsOrDirs, params)
        .then(() => {
          console.log("Successfully created PDF snapshots");
        })
        .catch((err) => {
          console.error(`An error occured when creating PDF snapshots: ${err}`);
        });
    });
};
