import { pdf } from "pdf-to-img";
import { LoadedPdfFile } from "./pdf-file.js";

export interface PdfFileLoader {
  loadPdfFile(path: string): Promise<LoadedPdfFile>;
}

export class LibPdfFileLoader implements PdfFileLoader {
  constructor(private readonly _pdf: typeof pdf = pdf) {}

  public async loadPdfFile(pdfFilePath: string): Promise<LoadedPdfFile> {
    const pdfFile = await this._pdf(pdfFilePath, {
      scale: 1,
    });

    return {
      path: pdfFilePath,
      pages: pdfFile.length,
      getPage: (page) => pdfFile.getPage(page),
    };
  }
}
