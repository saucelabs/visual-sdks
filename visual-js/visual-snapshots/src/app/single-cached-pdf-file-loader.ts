import { PdfFile } from "./pdf-file.js";
import { PdfFileLoader } from "./pdf-file-loader.js";

export class SingleCachedPdfFileLoader implements PdfFileLoader {
  private loadedFilePath?: string;
  private loadedFile?: PdfFile;

  constructor(private readonly pdfConverter: PdfFileLoader) {}

  public async loadPdfFile(path: string): Promise<PdfFile> {
    if (this.loadedFile && this.loadedFilePath === path) {
      return this.loadedFile;
    }

    this.loadedFile = await this.pdfConverter.loadPdfFile(path);
    this.loadedFilePath = path;
    return this.loadedFile;
  }
}
