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
import { CreateVisualSnapshotsParams, VisualSnapshots } from "../api.js";
import { SauceRegion } from "@saucelabs/visual";

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
      const visualSnapshots = new VisualSnapshots(
        options["username"],
        options["accessKey"],
        options["region"] as SauceRegion,
      );

      const params = {
        path: pdfFilePath,
        branch: options["branch"],
        buildName: options["buildName"],
        defaultBranch: options["defaultBranch"],
        project: options["project"],
        customId: options["customId"],
      } as CreateVisualSnapshotsParams;

      visualSnapshots
        .generateAndSendPdfFilSnapshotse(params)
        .then(() => {
          console.log("Successfully created snapshots");
        })
        .catch((err) => {
          console.error(`An error occured when creating snapshots: ${err}`);
        });
    });
};
