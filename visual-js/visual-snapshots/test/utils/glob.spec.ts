import { GlobFileExtractor } from "../../src/utils/glob.js";
import path from "path";
import { __dirname, __filename } from "../system-helpers.js";

const glob = new GlobFileExtractor();

describe("getFiles", () => {
  function normalize(paths: string[]) {
    return paths.map((p) => path.resolve(p)).sort((a, b) => a.localeCompare(b));
  }

  it("should return a file", async () => {
    const input = ["./src/index.ts"];
    const expected = normalize(input);

    const result = await glob.getFiles(input, "*");
    expect(normalize(result)).toEqual(expected);
  });

  it("should return multiple files", async () => {
    const input = ["./src/index.ts", __filename(import.meta)];
    const expected = normalize(input);

    const actual = await glob.getFiles(input, "*");
    expect(normalize(actual)).toEqual(expected);
  });

  it("should return files matched by glob", async () => {
    const input = [path.join(__dirname(import.meta), "*.spec.ts")];
    const expected = normalize([__filename(import.meta)]);

    const actual = await glob.getFiles(input, "*");
    expect(normalize(actual)).toEqual(expect.arrayContaining(expected));
  });

  it("should return files in directory matched by dir glob", async () => {
    const input = [__dirname(import.meta)];
    const expected = normalize([__filename(import.meta)]);

    const actual = await glob.getFiles(input, "*.spec.ts");
    expect(normalize(actual)).toEqual(expect.arrayContaining(expected));
  });

  it("should not return non-existing files", async () => {
    const input = [
      __filename(import.meta),
      __filename(import.meta) + ".not-existing",
    ];
    const expected = normalize([__filename(import.meta)]);

    const result = await glob.getFiles(input, "*");
    expect(normalize(result)).toEqual(expected);
  });

  it("should not return files from not existing dirs", async () => {
    const input = [__dirname(import.meta) + ".not-existing"];
    const expected: string[] = [];

    const result = await glob.getFiles(input, "*");
    expect(normalize(result)).toEqual(expected);
  });
});
