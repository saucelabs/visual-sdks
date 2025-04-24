import {
  buildFileMetadata,
  formatStringWithFileMetadata,
} from "../../src/utils/format.js";

describe("buildFileMetadata", () => {
  it("build file metadata for a file in the current directory ", () => {
    const expected = {
      filename: "test",
      ext: ".pdf",
      directory: "current-dir",
      directoryRelative: "",
      page: 1,
    };
    expect(
      buildFileMetadata(
        "/absolute/path/current-dir/test.pdf",
        1,
        "/absolute/path/current-dir"
      )
    ).toEqual(expected);
  });

  it("build file metadata for nested file", () => {
    const expected = {
      filename: "test1",
      ext: ".pdf",
      directory: "bar",
      directoryRelative: "foo/bar",
      page: 3,
    };
    expect(
      buildFileMetadata(
        "/absolute/path/current-dir/foo/bar/test1.pdf",
        3,
        "/absolute/path/current-dir"
      )
    ).toEqual(expected);
  });

  it("build file metadata for a file ourside the current directory ", () => {
    const expected = {
      filename: "test2",
      ext: ".pdf",
      directory: "bar",
      directoryRelative: "../another-dir/foo/bar",
      page: 1,
    };
    expect(
      buildFileMetadata(
        "/absolute/path/another-dir/foo/bar/test2.pdf",
        1,
        "/absolute/path/current-dir"
      )
    ).toEqual(expected);
  });
});

describe("formatStringWithFileMetadata", () => {
  const fileMetadata = {
    filename: "test",
    ext: "pdf",
    directory: "bar",
    directoryRelative: "foo/bar",
    page: 1,
  };

  it("should replace occurences of key with data from object", () => {
    const template = "{filename} {ext} {directory} {directoryRelative} {page}";
    const expected = "test pdf bar foo/bar 1";

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
