import {
  CreateVisualSnapshotsParams,
  VisualSnapshotsApi,
} from "../api/visual-snapshots-api.js";
import { initializeVisualApi, VisualApiParams } from "../api/visual-client.js";
import { PdfConverter } from "./pdf-converter.js";

export interface PdfCommandParams
  extends VisualApiParams,
    CreateVisualSnapshotsParams {}

export class PdfCommandHandler {
  public async handle(pdfFilePath: string, params: PdfCommandParams) {
    const visualApi = initializeVisualApi(params as VisualApiParams);
    const visualSnapshots = new VisualSnapshotsApi(visualApi);
    const pdfConverter = new PdfConverter();

    const pdfPageImages = await pdfConverter.convertPagesToImages(pdfFilePath);
    await visualSnapshots.generateAndSendPdfFilSnapshots(
      pdfPageImages,
      params as CreateVisualSnapshotsParams,
    );
  }
}
