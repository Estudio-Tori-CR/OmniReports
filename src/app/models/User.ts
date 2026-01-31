import { Schema, Types, model, models, type Model } from "mongoose";

export class User {
  _id?: Types.ObjectId;
  firstName!: string;
  lastName!: string;
  email!: string;
  password!: string;
  roles!: string;
  reports: string[] = [];
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean = false;

  constructor(init?: Partial<User>) {
    Object.assign(this, init);
  }
}

export type UserInt = {
  firstName: string;
  lastName: string;
  email: string;
  roles?: string;
  reports?: string[];
  isActive: boolean;
};

const userSchema = new Schema<User>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    roles: { type: String, required: true },
    reports: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const UserModel = (models.User ||
  model<User>("User", userSchema)) as Model<User>;
export default UserModel;
