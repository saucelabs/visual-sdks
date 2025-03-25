import { PdfPageSnapshotUploader } from "../../../src/app/worker/pdf-page-snapshot-uploader.js";
import { PdfFile } from "../../../src/app/pdf-file.js";
import { PdfFileLoader } from "../../../src/app/pdf-file-loader.js";
import { VisualSnapshotsApi } from "../../../src/api/visual-snapshots-api.js";

class TestPdfFile implements PdfFile {
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

    const uploadImageAndCreateSnapshot = jest.fn<
      ReturnType<VisualSnapshotsApi["uploadImageAndCreateSnapshot"]>,
      Parameters<VisualSnapshotsApi["uploadImageAndCreateSnapshot"]>
    >();

    const visualApiMock = {
      uploadImageAndCreateSnapshot,
    } as never as VisualSnapshotsApi;

    const files = [
      new TestPdfFile("file1.pdf", 4),
      new TestPdfFile("file2.pdf", 5),
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
      uploadImageAndCreateSnapshot.mockReset();
      uploadImageAndCreateSnapshot.mockImplementation(({ snapshot }) =>
        Promise.resolve(createUploadId(snapshot))
      );

      consoleInfoSpy.mockReset();
    });

    it("should call uploadImageAndCreateSnapshot", async () => {
      await uploader.uploadPageSnapshot(
        "build-id",
        files[0].path,
        1,
        "suiteName",
        "testName-{filename}",
        "snapshotName-{filename}-{page}"
      );

      expect(uploadImageAndCreateSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          buildId: "build-id",
          snapshot: await files[0].getPage(1),
          snapshotName: `snapshotName-${files[0].path}-1`,
          testName: `testName-${files[0].path}`,
          suiteName: "suiteName",
        })
      );
    });
  });
});
