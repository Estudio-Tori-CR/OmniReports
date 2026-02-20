import { Schema, Types, model, models, type Model } from "mongoose";

export class File {
  mimeType!: string;
  file!: string;
  fileName!: string;

  constructor(init?: Partial<File>) {
    Object.assign(this, init);
  }
}

export class PendingExportReport {
  _id?: Types.ObjectId;
  reportId!: string;
  files!: File[];
  status!: string;
  message!: string;

  constructor(init?: Partial<PendingExportReport>) {
    Object.assign(this, init);
  }
}

const fileSchema = new Schema<File>(
  {
    mimeType: { type: String, required: true, trim: true },
    file: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const pendingExportReportSchema = new Schema<PendingExportReport>(
  {
    reportId: { type: String, required: true, trim: true },
    files: { type: [fileSchema], default: [] },
    status: { type: String, required: true, trim: true, default: "P" },
    message: { type: String, trim: true },
  },
  { timestamps: true },
);

const PendingExportReportModel = (models.ExportReport ||
  model<PendingExportReport>(
    "ExportReport",
    pendingExportReportSchema,
  )) as Model<PendingExportReport>;

export default PendingExportReportModel;
