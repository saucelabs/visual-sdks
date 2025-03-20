import workerpool from "workerpool";
import { program } from "commander";
import {
  usernameOption,
  accessKeyOption,
  regionOption,
} from "../../commands/options.js";
import { initializeVisualApi } from "../visual-client.js";
import { LibPdfFileLoader } from "../../app/pdf-file-loader.js";
import { SingleCachedPdfFileLoader } from "./single-cached-pdf-file-loader.js";
import { PdfPageSnapshotUploader } from "./pdf-page-snapshot-uploader.js";
import type { WorkerMethod } from "../../utils/pool.js";
import { clientVersion } from "../../version.js";

program
  .addOption(usernameOption)
  .addOption(accessKeyOption)
  .addOption(regionOption);

program.parse();

const { user, key, region } = program.opts();

const api = initializeVisualApi(
  {
    user,
    key,
    region,
  },
  clientVersion
);

// Use a single caching PDF file loader. The files are processed sequentially,
// thus a worker will never re-visit a file, so there's no need to cache more files.
const pdfFileLoader = new SingleCachedPdfFileLoader(new LibPdfFileLoader());
const pdfWorkerApi = new PdfPageSnapshotUploader(api, pdfFileLoader);

const functions = {
  processPdfPage: pdfWorkerApi.uploadPageSnapshot.bind(pdfWorkerApi),
};

workerpool.worker(functions);

export type ProcessPdfPageMethod = WorkerMethod<
  "processPdfPage",
  (typeof functions)["processPdfPage"]
>;
