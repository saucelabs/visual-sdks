import { pdf } from "pdf-to-img";
import { PdfFile } from "./pdf-file.js";

export class PdfConverter {
  public async *convertPagesToImages(
    pdfFilePath: string
  ): AsyncGenerator<Buffer> {
    for await (const pdfPageImage of await pdf(pdfFilePath, { scale: 1 })) {
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
