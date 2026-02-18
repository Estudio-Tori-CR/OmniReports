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

export class DbFormula {
  column!: string;
  row!: string;
  formula!: string;
}

export class DbQuerys {
  title?: string;
  query!: string;
  instance!: Types.ObjectId | undefined | string;
  sheetName!: string;
  parameters!: DbParameters[];
  subQuery!: DbSubQuery;
  formulas?: DbFormula[];
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

export type FormulaInt = {
  column: string;
  row: string;
  formula: string;
};

export type QueryInt = {
  title?: string;
  query: string;
  instance: string;
  sheetName: string;
  parameters: ParametersInt[];
  subQuery: SubQueryInt;
  formulas?: FormulaInt[];
};

export type ReportInt = {
  _id?: string;
  name: string;
  querys: QueryInt[];
  directory: string;
  isActive: boolean;
};

export type QueryToExecute = {
  title?: string;
  connectionString: string;
  instanceType: string;
  query: string;
  subQuery: SubQueryInt;
  sheetName: string;
  formulas: DbFormula[];
};

export type ResultSubQuery = {
  result: Record<string, unknown>;
  subQuery: Record<string, unknown>[];
};

export type ResultToExcel = {
  title?: string;
  results: ResultSubQuery[] | Record<string, unknown>[];
  sheetName: string;
  formulas: FormulaInt[];
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

const FormulaSchema = new Schema<DbFormula>(
  {
    column: { type: String, trim: true, default: "" },
    row: { type: String, trim: true, default: "" },
    formula: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const QuerySchema = new Schema<DbQuerys>(
  {
    title: { type: String, trim: true, default: "" },
    query: { type: String, required: true },
    instance: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Instances",
    },
    sheetName: { type: String, trim: true },
    parameters: { type: [ParametersSchema], default: [] },
    subQuery: { type: SubQuerySchema, default: {} },
    formulas: { type: [FormulaSchema], default: [] },
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
