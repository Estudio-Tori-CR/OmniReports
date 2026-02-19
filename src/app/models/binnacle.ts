import { Schema, Types, model, models, type Model } from "mongoose";

export class Binnacle {
  _id?: Types.ObjectId | string;
  method!: string;
  user!: string;
  report!: string;
  requestIP!: string;

  constructor(init?: Partial<Binnacle>) {
    Object.assign(this, init);
  }
}

const binnacleSchema = new Schema<Binnacle>(
  {
    method: { type: String, required: true, trim: true },
    user: { type: String, required: true, trim: true },
    report: { type: String, required: false, trim: true },
    requestIP: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const BinnacleModel = (models.Binnacle ||
  model<Binnacle>("Binnacle", binnacleSchema)) as Model<Binnacle>;
export default BinnacleModel;
