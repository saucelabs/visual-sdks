import { PdfConverter } from "../../src/app/pdf-converter.js";

describe("PdfConverter", () => {
  test("convertPagesToImages", async () => {
    const pdf = jest.fn();

    const pdfFilePath = "./fake-pdf-file-path.pdf";
    const pdfConverter = new PdfConverter(pdf);
    for await (const _ of pdfConverter.convertPagesToImages(pdfFilePath)) {
    }

    expect(pdf).toHaveBeenCalledWith(pdfFilePath, { scale: 1 });
  });

  test("createPdfFile", async () => {
    const pdf = jest.fn();
    const pdfConverter = new PdfConverter(pdf);

    const pdfFilePath = "./fake-pdf-file-path.pdf";
    const pdfFile = pdfConverter.createPdfFile(pdfFilePath);

    for await (const _ of pdfFile.convertPagesToImages()) {
    }

    expect(pdfFile.path).toBe(pdfFilePath);
    expect(pdf).toHaveBeenCalledWith(pdfFilePath, { scale: 1 });
  });
});
