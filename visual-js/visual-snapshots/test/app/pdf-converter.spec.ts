import { PdfConverter } from "../../src/app/pdf-converter.js";

jest.mock("pdf-to-img", () => {
  async function* asyncIterable() {
    for (let i = 0; i < 2; i++) {
      yield `fake-image-buffer-${i}`;
    }
  }

  return {
    pdf: asyncIterable,
  };
});

describe("PdfConverter", () => {
  test("convertPagesToImages", async () => {
    const pdfFilePath = "./fake-pdf-file-path.pdf";
    const pdfConverter = new PdfConverter();
    const pdfPageImagesGenerator = await pdfConverter.convertPagesToImages(
      pdfFilePath
    );

    for (let i = 0; i < 2; ++i) {
      const pdfPageImage = await pdfPageImagesGenerator.next();
      expect(pdfPageImage).toEqual({
        done: false,
        value: `fake-image-buffer-${i}`,
      });
    }
    expect(await pdfPageImagesGenerator.next()).toEqual({
      done: true,
      value: undefined,
    });
  });
});
