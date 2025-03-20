import path from "path";
import { PdfConverter } from "../../src/app/pdf-converter.js";
import { __dirname } from "../helpers.js";

describe("PdfConverter", () => {
  test("convertPagesToImages", async () => {
    const pdf = jest.fn().mockResolvedValue([]);

    const pdfFilePath = "./fake-pdf-file-path.pdf";
    const pdfConverter = new PdfConverter(pdf);
    for await (const _ of pdfConverter.convertPagesToImages(pdfFilePath)) {
    }

    expect(pdf).toHaveBeenCalledWith(pdfFilePath, { scale: 1 });
  });

  test("convertPagesToImages", async () => {
    const pdfFilePath = path.join(__dirname(import.meta), "../files/test.pdf");
    const pdfConverter = new PdfConverter();

    let pages = 0;
    for await (const _ of pdfConverter.convertPagesToImages(pdfFilePath)) {
      pages++;
    }

    expect(pages).toEqual(3);
  });

  test("createPdfFile", async () => {
    const pdf = jest.fn().mockResolvedValue([]);
    const pdfConverter = new PdfConverter(pdf);

    const pdfFilePath = "./fake-pdf-file-path.pdf";
    const pdfFile = pdfConverter.createPdfFile(pdfFilePath);

    for await (const _ of pdfFile.convertPagesToImages()) {
    }

    expect(pdfFile.path).toBe(pdfFilePath);
    expect(pdf).toHaveBeenCalledWith(pdfFilePath, { scale: 1 });
  });
});
