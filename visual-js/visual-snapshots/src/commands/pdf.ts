import { Command } from "commander";
import {
  accessKeyOption,
  branchOption,
  buildIdOption,
  buildNameOption,
  concurrencyOption,
  customIdOption,
  defaultBranchOption,
  projectOption,
  regionOption,
  snapshotNameOption,
  suiteNameOption,
  testNameOption,
  usernameOption,
} from "./options.js";
import { PdfCommandHandler, PdfCommandParams } from "../app/pdf-handler.js";
import { VisualSnapshotsApi } from "../api/visual-snapshots-api.js";
import { initializeVisualApi } from "../api/visual-client.js";
import { WorkerPoolPdfSnapshotUploader } from "../app/worker/worker-pool-pdf-snapshot-uploader.js";
import { LibPdfFileLoader } from "../app/pdf-file-loader.js";
import { logger } from "../logger.js";

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
    .addOption(concurrencyOption)
    .action((globsOrDirs: string[], params: PdfCommandParams) => {
      const visualSnapshotsApi = new VisualSnapshotsApi(
        initializeVisualApi(params, clientVersion)
      );
      const pdfSnapshotUploader = new WorkerPoolPdfSnapshotUploader(
        new LibPdfFileLoader(),
        {
          maxWorkers: params.concurrency,
        }
      );

      new PdfCommandHandler(visualSnapshotsApi, pdfSnapshotUploader)
        .handle(globsOrDirs, params)
        .then(() => {
          logger.info("Successfully created PDF snapshots.");
        })
        .catch((err) => {
          logger.error(err, "At least one PDF snapshot creation failed.");
        });
    });
};
