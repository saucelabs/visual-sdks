import { LoadedPdfFile } from "../../app/pdf-file.js";
import { PdfFileLoader } from "../../app/pdf-file-loader.js";

export class SingleCachedPdfFileLoader implements PdfFileLoader {
  private loadedFilePath?: string;
  private loadedFile?: LoadedPdfFile;

  constructor(private readonly pdfConverter: PdfFileLoader) {}

  public async loadPdfFile(path: string): Promise<LoadedPdfFile> {
    if (this.loadedFile && this.loadedFilePath === path) {
      return this.loadedFile;
    }

    this.loadedFile = await this.pdfConverter.loadPdfFile(path);
    this.loadedFilePath = path;
    return this.loadedFile;
  }
}
