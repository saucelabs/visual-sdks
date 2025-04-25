import { FileExtractor } from "../src/utils/glob.js";

export class MockFileExtractor implements FileExtractor {
  private files: string[] = [];

  public setFilesToReturn(files: string[]) {
    this.files = files;
  }

  public async getFiles(_globOrDirs: string[], _dirGlob: string) {
    return this.files;
  }
}
