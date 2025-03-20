import { SingleCachedPdfFileLoader } from "../../../src/app/single-cached-pdf-file-loader.js";
import { PdfFileLoader } from "../../../src/app/pdf-file-loader.js";

describe("SingleCachedPdfFileLoader", () => {
  function createUnderlyingLoader() {
    const loadPdfFile = jest
      .fn<
        ReturnType<PdfFileLoader["loadPdfFile"]>,
        Parameters<PdfFileLoader["loadPdfFile"]>
      >()
      .mockResolvedValue({} as never);

    const underlyingLoader: PdfFileLoader = {
      loadPdfFile,
    };

    return { loadPdfFile, underlyingLoader };
  }

  it("should call underlying loader with full path", async () => {
    const { loadPdfFile, underlyingLoader } = createUnderlyingLoader();

    const path = "a/b/c/file.pdf";

    const loader = new SingleCachedPdfFileLoader(underlyingLoader);
    await loader.loadPdfFile(path);

    expect(loadPdfFile).toHaveBeenCalledWith(path);
  });

  it("should load file once if loaded twice with the same path", async () => {
    const { loadPdfFile, underlyingLoader } = createUnderlyingLoader();

    const path = "file.pdf";

    const loader = new SingleCachedPdfFileLoader(underlyingLoader);

    await loader.loadPdfFile(path);
    await loader.loadPdfFile(path);

    expect(loadPdfFile).toHaveBeenCalledTimes(1);
  });

  it("should load other files if path changes", async () => {
    const { loadPdfFile, underlyingLoader } = createUnderlyingLoader();

    const path1 = "file1.pdf";
    const path2 = "file2.pdf";

    const loader = new SingleCachedPdfFileLoader(underlyingLoader);

    await loader.loadPdfFile(path1);
    await loader.loadPdfFile(path2);

    expect(loadPdfFile).toHaveBeenCalledWith(path1);
    expect(loadPdfFile).toHaveBeenCalledWith(path2);
  });

  it("should reload first files if other file is loaded", async () => {
    const { loadPdfFile, underlyingLoader } = createUnderlyingLoader();

    const path1 = "file1.pdf";
    const path2 = "file2.pdf";

    const loader = new SingleCachedPdfFileLoader(underlyingLoader);

    await loader.loadPdfFile(path1);
    await loader.loadPdfFile(path1);
    await loader.loadPdfFile(path2);
    await loader.loadPdfFile(path2);
    await loader.loadPdfFile(path1);
    await loader.loadPdfFile(path1);

    expect(loadPdfFile.mock.calls).toEqual([[path1], [path2], [path1]]);
  });
});
