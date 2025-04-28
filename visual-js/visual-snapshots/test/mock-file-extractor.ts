import { FileExtractor } from "../src/utils/glob.js";

export class MockFileExtractor implements FileExtractor {
  private files: string[] = [];
  private calledWith: { globOrDirs: string[]; dirGlob: string }[] = [];

  public setFilesToReturn(files: string[]) {
    this.files = files;
  }

  public async getFiles(globOrDirs: string[], dirGlob: string) {
    this.calledWith.push({ globOrDirs, dirGlob });
    return this.files;
  }

  public reset() {
    this.files = [];
    this.calledWith = [];
  }

  public calls() {
    return this.calledWith;
  }
}
