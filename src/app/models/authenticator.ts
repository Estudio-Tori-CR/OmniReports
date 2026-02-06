import { Schema, Types, model, models, type Model } from "mongoose";

export class Authenticator {
  _id?: Types.ObjectId;
  token!: string;
  user!: Types.ObjectId;
  expiredDate!: Date;
  status!: string;

  constructor(init?: Partial<Authenticator>) {
    Object.assign(this, init);
  }
}

export type AuthenticatorResp = {
  length: number;
  expirationDate: Date;
};

const authenticatorSchema = new Schema<Authenticator>(
  {
    token: { type: String, required: true, trim: true },
    user: { type: Types.ObjectId, required: true, trim: true },
    expiredDate: { type: Date, required: true, trim: true },
    status: { type: String, required: true, trim: true, default: "S" },
  },
  { timestamps: true },
);

const AuthenticatorModel = (models.Authenticator ||
  model<Authenticator>(
    "Authenticator",
    authenticatorSchema,
  )) as Model<Authenticator>;
export default AuthenticatorModel;
