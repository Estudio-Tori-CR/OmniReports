import { Schema, Types, model, models, type Model } from "mongoose";

export class DirectoryReports {
  _id?: Types.ObjectId;
  name!: string;
  path!: string;

  constructor(init?: Partial<DirectoryReports>) {
    Object.assign(this, init);
  }
}

const directoryReportsSchema = new Schema<DirectoryReports>(
  {
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const DirectoryReportsModel = (models.DirectoryReports ||
  model<DirectoryReports>(
    "DirectoryReports",
    directoryReportsSchema,
  )) as Model<DirectoryReports>;
export default DirectoryReportsModel;
