import { getFiles } from "../../src/utils/glob.js";
import path from "path";

describe("getFiles", () => {
  function resolvePath(p: string) {
    return path.resolve(p);
  }

  it("should return a file", async () => {
    const input = ["./src/index.ts"];
    const expected = input.map(resolvePath);

    const result = await getFiles(input, "*");
    expect(result.map(resolvePath)).toEqual(expected);
  });

  it("should return multiple files", async () => {
    const input = ["./src/index.ts", __filename];
    const expected = input.map(resolvePath);

    const actual = await getFiles(input, "*");
    expect(actual.map(resolvePath)).toEqual(expected);
  });

  it("should return files matched by glob", async () => {
    const input = [path.join(__dirname, "*.spec.ts")];
    const expected = [resolvePath(__filename)];

    const actual = await getFiles(input, "*");
    expect(actual.map(resolvePath)).toEqual(expect.arrayContaining(expected));
  });

  it("should return files in directory matched by dir glob", async () => {
    const input = [__dirname];
    const expected = [resolvePath(__filename)];

    const actual = await getFiles(input, "*.spec.ts");
    expect(actual.map(resolvePath)).toEqual(expect.arrayContaining(expected));
  });

  it("should not return non-existing files", async () => {
    const input = [__filename, __filename + ".not-existing"];
    const expected = [resolvePath(__filename)];

    const result = await getFiles(input, "*");
    expect(result.map(resolvePath)).toEqual(expected);
  });

  it("should not return files from not existing dirs", async () => {
    const input = [__dirname + ".not-existing"];
    const expected: string[] = [];

    const result = await getFiles(input, "*");
    expect(result.map(resolvePath)).toEqual(expected);
  });
});
