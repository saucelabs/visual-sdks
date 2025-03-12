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
    CreateVisualSnapshotsParams {
  readonly recursive?: boolean;
}

export class PdfCommandHandler {
  private clientVersion: string;

  constructor(clientVersion: string) {
    this.clientVersion = clientVersion;
  }

  public async handle(globsOrDirs: string[], params: PdfCommandParams) {
    const visualApi = initializeVisualApi(params, this.clientVersion);
    const visualSnapshots = new VisualSnapshotsApi(visualApi);
    const pdfConverter = new PdfConverter();

    const pdfFilePaths = await getFiles(
      globsOrDirs,
      params.recursive ? "**/*.pdf" : "*.pdf"
    );

    for (const pdfFilePath of pdfFilePaths) {
      const pdfPageImages = pdfConverter.convertPagesToImages(pdfFilePath);
      await visualSnapshots.generateAndSendPdfFileSnapshots(
        pdfFilePath,
        pdfPageImages,
        params
      );
    }
  }
}
