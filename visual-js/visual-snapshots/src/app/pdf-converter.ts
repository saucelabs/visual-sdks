import { pdf } from "pdf-to-img";
import { PdfFile } from "./pdf-file.js";

export class PdfConverter {
  constructor(private readonly _pdf: typeof pdf = pdf) {}

  public async *convertPagesToImages(
    pdfFilePath: string
  ): AsyncGenerator<Buffer> {
    return await this._pdf(pdfFilePath, { scale: 1 });
  }

  public createPdfFile(pdfFilePath: string): PdfFile {
    return {
      path: pdfFilePath,
      convertPagesToImages: () => this.convertPagesToImages(pdfFilePath),
    };
  }
}
