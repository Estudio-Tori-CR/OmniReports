import { Schema, Types, model, models, type Model } from "mongoose";
import { Instance } from "./Instance";

export class DbParameters {
  name!: string;
  label!: string;
  type!: string;
  isRequired!: boolean;
}

export class DbSubQuery {
  query!: string;
  innerBy!: string;
}

export class DbQuerys {
  query!: string;
  instance!: Types.ObjectId | undefined | string;
  sheetName!: string;
  parameters!: DbParameters[];
  subQuery!: DbSubQuery;
}

export class DBReport {
  _id?: Types.ObjectId | undefined | string;
  name!: string;
  querys!: DbQuerys[];
  directory!: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean = false;

  constructor(init?: Partial<Report>) {
    Object.assign(this, init);
  }
}

export type ParametersInt = {
  name: string;
  label: string;
  type: string;
  isRequired: boolean;
};

export type SubQueryInt = {
  query: string;
  innerBy: string;
};

export type QueryInt = {
  query: string;
  instance: string;
  sheetName: string;
  parameters: ParametersInt[];
  subQuery: SubQueryInt;
};

export type ReportInt = {
  _id?: string;
  name: string;
  querys: QueryInt[];
  directory: string;
  isActive: boolean;
};

export type QueryToExecute = {
  connectionString: string;
  instanceType: string;
  query: string;
  subQuery: SubQueryInt;
  sheetName: string;
};

export type ResultSubQuery = {
  result: Record<string, unknown>;
  subQuery: Record<string, unknown>[];
};

export type ResultToExcel = {
  results: ResultSubQuery[] | Record<string, unknown>[];
  sheetName: string;
};

export type ExportReport = {
  report: DBReport | string;
  instances: Instance[] | null | undefined | string;
  isEncrypted: boolean;
};

const ParametersSchema = new Schema<DbParameters>(
  {
    name: { type: String },
    label: { type: String },
    type: { type: String },
    isRequired: { type: Boolean },
  },
  { _id: false },
);

const SubQuerySchema = new Schema<DbSubQuery>(
  {
    query: { type: String },
    innerBy: { type: String },
  },
  { _id: false },
);

const QuerySchema = new Schema<DbQuerys>(
  {
    query: { type: String, required: true },
    instance: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Instances",
    },
    sheetName: { type: String, trim: true },
    parameters: { type: [ParametersSchema], default: [] },
    subQuery: { type: SubQuerySchema, default: {} },
  },
  { _id: false },
);

const ReportSchema = new Schema<DBReport>(
  {
    name: { type: String, required: true, trim: true },
    querys: { type: [QuerySchema], required: true, default: [] },
    directory: { type: String, required: false, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const ReportModel =
  (models.Report as Model<DBReport>) || model<DBReport>("Report", ReportSchema);

export default ReportModel;
