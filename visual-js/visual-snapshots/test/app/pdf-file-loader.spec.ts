import { LibPdfFileLoader } from "../../src/app/pdf-file-loader.js";
import { __dirname } from "../helpers.js";

describe("LibPdfFileLoader", () => {
  it("should call library with path and scale", async () => {
    const lib = jest.fn().mockResolvedValue({
      length: 10,
      getPage: jest.fn(),
    });

    const loader = new LibPdfFileLoader(lib);

    await loader.loadPdfFile("file.pdf");

    expect(lib).toHaveBeenCalledWith("file.pdf", { scale: 1 });
  });

  it("should return LoadedPdfFile with same path", async () => {
    const lib = jest.fn().mockResolvedValue({
      length: 10,
      getPage: jest.fn(),
    });
    const loader = new LibPdfFileLoader(lib);
    const path = "path/to/file.pdf";

    const file = await loader.loadPdfFile(path);

    expect(file.path).toEqual(path);
  });

  it("should return LoadedPdfFile with same length", async () => {
    const length = 10;

    const lib = jest.fn().mockResolvedValue({
      length,
      getPage: jest.fn(),
    });

    const loader = new LibPdfFileLoader(lib);

    const file = await loader.loadPdfFile("file.pdf");

    expect(file.pages).toEqual(length);
  });

  it("should return LoadedPdfFile with getPage calling lib's getPage", async () => {
    const getPage = jest.fn();

    const lib = jest.fn().mockResolvedValue({
      length: 10,
      getPage,
    });

    const loader = new LibPdfFileLoader(lib);

    const file = await loader.loadPdfFile("file.pdf");
    await file.getPage(5);

    expect(getPage).toHaveBeenCalledWith(5);
  });
});
