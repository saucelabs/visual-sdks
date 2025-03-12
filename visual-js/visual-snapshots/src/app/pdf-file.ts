export interface PdfFile {
  readonly path: string;
  convertPagesToImages(): AsyncGenerator<Buffer>;
}
