import path from "path";

/**
 * Replaces all occurrences of keys in format of `{key}` in `value` with `data[key]`.
 *
 * If `key` does not exist in data, it is left as it is.
 */
function formatString(value: string, data: Record<string, string | number>) {
  return Object.entries(data)
    .map(([k, v]) => [k, v.toString()] as const)
    .reduce((current, [k, v]) => current.replaceAll(`{${k}}`, v), value);
}

type FileMetadata = {
  filename: string;
  ext: string;
  directory: string;
  directoryRelative: string;
  page: number;
};

export function buildFileMetadata(
  pdfFilePath: string,
  pageNumber: number,
  currentDir: string = process.cwd()
): FileMetadata {
  const dirname = path.dirname(pdfFilePath);
  return {
    filename: path.basename(pdfFilePath).split(".").slice(0, -1).join("."),
    ext: path.extname(pdfFilePath),
    directory: dirname.split(path.sep).at(-1) ?? "",
    directoryRelative: path.relative(currentDir, dirname),
    page: pageNumber,
  };
}

export function formatStringWithFileMetadata(
  template: string,
  fileMetadata: FileMetadata
) {
  return formatString(template, fileMetadata);
}
