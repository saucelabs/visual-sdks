import { pdf } from "pdf-to-img";
import { PdfFile } from "./pdf-file.js";

export class PdfConverter {
  constructor(private readonly _pdf: typeof pdf = pdf) {}

  public async *convertPagesToImages(
    pdfFilePath: string
  ): AsyncGenerator<Buffer> {
    for await (const pdfPageImage of await this._pdf(pdfFilePath, {
      scale: 1,
    })) {
      yield pdfPageImage;
    }
  }

  public createPdfFile(pdfFilePath: string): PdfFile {
    return {
      path: pdfFilePath,
      convertPagesToImages: () => this.convertPagesToImages(pdfFilePath),
    };
  }
}
