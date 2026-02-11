class ParametersReport {
  constructor() {
    this._type = "";
    this._name = "";
    this._value = "";
    this._isRequired = false;
  }

  private _type: string;
  public get type(): string {
    return this._type;
  }
  public set type(v: string) {
    this._type = v;
  }

  private _name: string;
  public get name(): string {
    return this._name;
  }
  public set name(v: string) {
    this._name = v;
  }

  private _value: string | number;
  public get value(): string | number {
    return this._value;
  }
  public set value(v: string | number) {
    this._value = v;
  }

  private _isRequired: boolean;
  public get isRequired(): boolean {
    return this._isRequired;
  }
  public set isRequired(v: boolean) {
    this._isRequired = v;
  }

  toJSON() {
    return {
      type: this.type,
      name: this.name,
      value: this.value,
      isRequired: this.isRequired,
    };
  }
}

class QueryParams {
  constructor() {
    this._sheetName = "";
    this._parameters = [];
  }
  private _sheetName: string;
  public get sheetName(): string {
    return this._sheetName;
  }
  public set sheetName(v: string) {
    this._sheetName = v;
  }

  private _parameters: ParametersReport[];
  public get parameters(): ParametersReport[] {
    return this._parameters;
  }
  public set parameters(v: ParametersReport[]) {
    this._parameters = v;
  }

  toJSON() {
    return {
      sheetName: this.sheetName,
      parameters: this.parameters,
    };
  }
}

class ExecuteReport {
  constructor() {
    this._id = "";
    this._queryParams = [];
  }

  private _id: string;
  public get id(): string {
    return this._id;
  }
  public set id(v: string) {
    this._id = v;
  }

  private _queryParams: QueryParams[];
  public get queryParams(): QueryParams[] {
    return this._queryParams;
  }
  public set queryParams(v: QueryParams[]) {
    this._queryParams = v;
  }

  toJSON() {
    return {
      _id: this._id,
      queryParams: this.queryParams,
    };
  }
}

export { ParametersReport, ExecuteReport, QueryParams };
