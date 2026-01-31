import { Schema, Types, model, models, type Model } from "mongoose";

export class Instance {
  _id?: Types.ObjectId | string | undefined;
  name!: string;
  connectionString!: string;
  type!: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean = false;

  constructor(init?: Partial<Instance>) {
    Object.assign(this, init);
  }
}

export type InstanceInt = {
  _id?: string;
  name: string;
  connectionString: string;
  type: string;
  isActive: boolean;
};

const InstanceSchema = new Schema<Instance>(
  {
    name: { type: String, required: true, trim: true },
    connectionString: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const InstanceModel =
  (models.Instances as Model<Instance>) ||
  model<Instance>("Instances", InstanceSchema);

export default InstanceModel;
