import { glob } from "glob";
import fs from "fs/promises";
import path from "path";

export interface FileExtractor {
  getFiles(globOrDirs: string[], dirGlob: string): Promise<string[]>;
}

export class GlobFileExtractor implements FileExtractor {
  /**
   * Returns all files matched by globs, or if path is a directory, matched by `dirGlob`.
   * @param globOrDirs Globs or dirs to get files from.
   * @param dirGlob Glob to append to directory path.
   * @returns Matched files.
   */
  public async getFiles(globOrDirs: string[], dirGlob: string) {
    const globs = await Promise.all(
      globOrDirs.map((g) =>
        this.isDirectory(g).then((result) =>
          result ? path.join(g, dirGlob) : g
        )
      )
    );

    return await glob(globs);
  }

  private async isDirectory(path: string) {
    try {
      const stat = await fs.stat(path);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
