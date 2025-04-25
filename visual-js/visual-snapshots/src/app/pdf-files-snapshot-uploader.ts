export interface UploadPdfSnapshotsParams {
  readonly buildId: string;
  readonly pdfFilePaths: string[];
  readonly suiteNameFormat: string;
  readonly testNameFormat: string;
  readonly snapshotNameFormat: string;
}

export interface PdfSnapshotUploader {
  uploadSnapshots(params: UploadPdfSnapshotsParams): Promise<void>;
}
