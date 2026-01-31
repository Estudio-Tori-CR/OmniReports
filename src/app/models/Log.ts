import { Schema, Types, model, models, type Model } from "mongoose";

export class Log {
  _id?: Types.ObjectId;
  type!: string;
  message!: string;

  constructor(init?: Partial<Log>) {
    Object.assign(this, init);
  }
}

const logSchema = new Schema<Log>(
  {
    type: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const LogModel = (models.Log || model<Log>("Log", logSchema)) as Model<Log>;
export default LogModel;
