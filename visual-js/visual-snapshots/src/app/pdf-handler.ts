import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../api/visual-snapshots-api.js";
import { initializeVisualApi } from "../api/visual-client.js";
import { PdfConverter } from "./pdf-converter.js";
import { VisualConfig } from "@saucelabs/visual";
import { getFiles } from "../utils/glob.js";

export interface PdfCommandParams
  extends VisualConfig,
    CreateVisualSnapshotsParams {}

export class PdfCommandHandler {
  private clientVersion: string;

  constructor(clientVersion: string) {
    this.clientVersion = clientVersion;
  }

  public async handle(globsOrDirs: string[], params: PdfCommandParams) {
    const visualApi = initializeVisualApi(params, this.clientVersion);
    const visualSnapshots = new VisualSnapshotsApi(visualApi);
    const pdfConverter = new PdfConverter();

    const pdfFilePaths = await getFiles(globsOrDirs, "*.pdf");

    const pdfFiles = pdfFilePaths.map((p) => pdfConverter.createPdfFile(p));
    await visualSnapshots.generateAndSendPdfFileSnapshots(pdfFiles, params);
  }
}
