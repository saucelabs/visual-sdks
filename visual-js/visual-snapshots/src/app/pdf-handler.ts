import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../api/visual-snapshots-api.js";
import { initializeVisualApi } from "../api/visual-client.js";
import { PdfConverter } from "./pdf-converter.js";
import { VisualConfig } from "@saucelabs/visual";

export interface PdfCommandParams
  extends VisualConfig,
    CreateVisualSnapshotsParams {}

export class PdfCommandHandler {
  public async handle(pdfFilePath: string, params: PdfCommandParams) {
    const visualApi = initializeVisualApi(params);
    const visualSnapshots = new VisualSnapshotsApi(visualApi);
    const pdfConverter = new PdfConverter();

    const pdfPageImages = pdfConverter.convertPagesToImages(pdfFilePath);
    await visualSnapshots.generateAndSendPdfFileSnapshots(
      pdfPageImages,
      params,
    );
  }
}
