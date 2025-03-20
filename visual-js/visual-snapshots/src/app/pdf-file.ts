export interface PdfFile {
  readonly path: string;
  readonly pages: number;
  getPage(page: number): Promise<Buffer>;
}
