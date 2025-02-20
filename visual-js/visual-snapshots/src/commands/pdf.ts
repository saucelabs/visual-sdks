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
import {
  CreateVisualSnapshotsParams,
  VisualSnapshots,
  VisualSnapshotsParams,
} from "../api.js";

interface VisualSnapshotsOptions
  extends VisualSnapshotsParams,
    CreateVisualSnapshotsParams {}

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
    .action((pdfFilePath: string, options: VisualSnapshotsOptions) => {
      const visualSnapshots = new VisualSnapshots(
        options as VisualSnapshotsParams,
      );
      visualSnapshots
        .generateAndSendPdfFilSnapshotse(
          pdfFilePath,
          options as CreateVisualSnapshotsParams,
        )
        .then(() => {
          console.log("Successfully created snapshots");
        })
        .catch((err) => {
          console.error(`An error occured when creating snapshots: ${err}`);
        });
    });
};
