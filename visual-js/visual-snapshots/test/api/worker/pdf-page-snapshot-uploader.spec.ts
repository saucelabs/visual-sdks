import { DiffingMethod, VisualApi } from "@saucelabs/visual";
import { PdfPageSnapshotUploader } from "../../../src/api/worker/pdf-page-snapshot-uploader.js";
import { LoadedPdfFile } from "../../../src/app/pdf-file.js";
import { PdfFileLoader } from "../../../src/app/pdf-file-loader.js";
import path from "path";

class TestLoadedPdfFile implements LoadedPdfFile {
  constructor(public readonly path: string, public readonly pages: number) {}

  public async getPage(page: number): Promise<Buffer> {
    return Buffer.from(`fake-image-buffer-${page}`);
  }
}

function createUploadId(content: Buffer) {
  return `upload-id:${content.toString("utf-8")}`;
}

describe("PdfPageSnapshotUploader", () => {
  describe("uploadPageSnapshot", () => {
    const consoleInfoSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    const uploadSnapshotMock = jest.fn<
      ReturnType<VisualApi["uploadSnapshot"]>,
      Parameters<VisualApi["uploadSnapshot"]>
    >();
    const createSnapshotMock = jest.fn<
      ReturnType<VisualApi["createSnapshot"]>,
      Parameters<VisualApi["createSnapshot"]>
    >();

    const visualApiMock = {
      uploadSnapshot: uploadSnapshotMock,
      createSnapshot: createSnapshotMock,
    } as never as VisualApi;

    const files = [
      new TestLoadedPdfFile("file1.pdf", 4),
      new TestLoadedPdfFile("file2.pdf", 5),
    ];

    const loadPdfFileMock = jest
      .fn<
        ReturnType<PdfFileLoader["loadPdfFile"]>,
        Parameters<PdfFileLoader["loadPdfFile"]>
      >()
      .mockImplementation(async (path) => {
        const file = files.find((f) => f.path === path);
        if (!file) {
          throw new Error("file not found");
        }
        return file;
      });

    const pdfLoaderMock: PdfFileLoader = {
      loadPdfFile: loadPdfFileMock,
    };

    const uploader = new PdfPageSnapshotUploader(visualApiMock, pdfLoaderMock);

    beforeEach(() => {
      uploadSnapshotMock.mockReset();
      uploadSnapshotMock.mockImplementation(({ image }) =>
        image && "data" in image
          ? Promise.resolve(createUploadId(image.data))
          : Promise.reject(new Error("image data is missing"))
      );

      createSnapshotMock.mockReset();
      consoleInfoSpy.mockReset();
    });

    it("should call uploadSnapshot visual API", async () => {
      await uploader.uploadPageSnapshot(
        "build-id",
        files[0].path,
        1,
        "suiteName",
        "testName-{filename}",
        "snapshotName-{filename}-{page}"
      );

      expect(uploadSnapshotMock).toHaveBeenCalledWith({
        buildId: "build-id",
        image: { data: await files[0].getPage(1) },
      });
    });

    it("should call createSnapshot visual API", async () => {
      await uploader.uploadPageSnapshot(
        "build-id",
        files[0].path,
        1,
        "suiteName",
        "testName-{filename}",
        "snapshotName-{filename}-{page}"
      );

      expect(createSnapshotMock).toHaveBeenCalledWith({
        buildId: "build-id",
        uploadId: createUploadId(await files[0].getPage(1)),
        name: `snapshotName-${path.basename(files[0].path)}-1`,
        suiteName: "suiteName",
        testName: `testName-${path.basename(files[0].path)}`,
        diffingMethod: DiffingMethod.Balanced,
      });
    });

    it("should print output matching snapshot", async () => {
      await uploader.uploadPageSnapshot(
        "build-id",
        files[0].path,
        1,
        "suiteName",
        "testName-{filename}",
        "snapshotName-{filename}-{page}"
      );

      expect(consoleInfoSpy).toMatchSnapshot();
    });
  });
});
