import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../api/visual-snapshots-api.js";
import { initializeVisualApi } from "../api/visual-client.js";
import { PdfConverter } from "./pdf-converter.js";
import { VisualConfig } from "@saucelabs/visual";
import path from "path";

export interface PdfCommandParams
  extends VisualConfig,
    CreateVisualSnapshotsParams {}

export class PdfCommandHandler {
  private clientVersion: string;

  constructor(clientVersion: string) {
    this.clientVersion = clientVersion;
  }

  public async handle(pdfFilePath: string, params: PdfCommandParams) {
    const visualApi = initializeVisualApi(params, this.clientVersion);
    const visualSnapshots = new VisualSnapshotsApi(visualApi);
    const pdfConverter = new PdfConverter();

    const pdfPageImages = pdfConverter.convertPagesToImages(pdfFilePath);
    await visualSnapshots.generateAndSendPdfFileSnapshots(
      path.basename(pdfFilePath),
      pdfPageImages,
      params
    );
  }
}
