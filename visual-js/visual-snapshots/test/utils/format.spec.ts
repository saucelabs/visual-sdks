import {
  formatString,
  formatStringWithFileMetadata,
} from "../../src/utils/format.js";

describe("formatString", () => {
  it("should replace all occurences of key with data from object", () => {
    const value = "foo {foo} bar {foo} {bar}";
    const data = { foo: "xyz", bar: 123 };
    const expected = "foo xyz bar xyz 123";

    expect(formatString(value, data)).toEqual(expected);
  });

  it("should not replace keys that do not exist in data", () => {
    const value = "foo {foo}";
    const data = { bar: 123 };
    const expected = "foo {foo}";

    expect(formatString(value, data)).toEqual(expected);
  });
});

describe("formatStringWithFileMetadata", () => {
  const fileMetadata = {
    filename: "test",
    ext: "pdf",
    directory: "bar",
    directoryRelative: "/foo/bar",
    page: 1,
  };

  it("should replace occurences of key with data from object", () => {
    const template = "{filename} {ext} {directory} {directoryRelative} {page}";
    const expected = "test pdf bar /foo/bar 1";

    expect(formatStringWithFileMetadata(template, fileMetadata)).toEqual(
      expected
    );
  });

  it("should replace all occurences of a specific key with data from object", () => {
    const template = "{filename} {ext} {ext} {ext} {filename}";
    const expected = "test pdf pdf pdf test";

    expect(formatStringWithFileMetadata(template, fileMetadata)).toEqual(
      expected
    );
  });

  it("should not replace keys that do not exist in data", () => {
    const template = "{something else} is not replaced";

    expect(formatStringWithFileMetadata(template, fileMetadata)).toEqual(
      template
    );
  });
});
