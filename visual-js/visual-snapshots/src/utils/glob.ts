import { glob } from "glob";
import fs from "fs/promises";
import path from "path";

/**
 * Returns all files matched by globs, or if path is a directory, matched by `dirGlob`.
 * @param globOrDirs Globs or dirs to get files from.
 * @param dirGlob Glob to append to directory path.
 * @returns Matched files.
 */
export async function getFiles(globOrDirs: string[], dirGlob: string) {
  const globs = await Promise.all(
    globOrDirs.map((g) =>
      isDirectory(g).then((result) => (result ? path.join(g, dirGlob) : g))
    )
  );

  return await glob(globs);
}

async function isDirectory(path: string) {
  try {
    const stat = await fs.stat(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
