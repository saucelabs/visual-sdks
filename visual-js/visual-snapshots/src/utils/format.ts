import path from "path";

/**
 * Replaces all occurrences of keys in format of `{key}` in `value` with `data[key]`.
 *
 * If `key` does not exist in data, it is left as it is.
 */
export function formatString( // TODO: do not export
  value: string,
  data: Record<string, string | number>
) {
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
  pageNumber: number
): FileMetadata {
  return {
    filename: path.basename(pdfFilePath).split(".").slice(0, -1).join("."),
    ext: path.extname(pdfFilePath),
    directory: path.dirname(pdfFilePath),
    directoryRelative: path.relative(process.cwd(), pdfFilePath),
    page: pageNumber,
  };
}

export function formatStringWithFileMetadata(
  template: string,
  fileMetadata: FileMetadata
) {
  return formatString(template, fileMetadata);
}
