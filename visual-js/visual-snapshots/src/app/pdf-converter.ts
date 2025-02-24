import { pdf } from "pdf-to-img";

export class PdfConverter {
  public async *convertPagesToImages(
    pdfFilePath: string,
  ): AsyncGenerator<Buffer> {
    for await (const pdfPageImage of await pdf(pdfFilePath)) {
      yield pdfPageImage;
    }
  }
}
