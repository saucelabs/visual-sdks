export interface LoadedPdfFile {
  readonly path: string;
  readonly pages: number;
  getPage(page: number): Promise<Buffer>;
}
