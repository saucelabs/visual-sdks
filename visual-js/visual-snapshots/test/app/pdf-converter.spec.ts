import { PdfConverter } from "../../src/app/pdf-converter.js";

jest.mock("pdf-to-img", () => {
  const asyncIterable = {
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          if (this.i < 2) {
            return Promise.resolve({
              value: `fake-image-buffer-${this.i++}`,
              done: false,
            });
          }

          return Promise.resolve({ done: true });
        },
      };
    },
  };

  return {
    pdf: jest.fn().mockReturnValue(asyncIterable),
  };
});

describe("PdfConverter", () => {
  test("convertPagesToImages", async () => {
    const pdfFilePath = "./fake-pdf-file-path.pdf";
    const pdfConverter = new PdfConverter();
    const pdfPageImagesGenerator =
      await pdfConverter.convertPagesToImages(pdfFilePath);

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
