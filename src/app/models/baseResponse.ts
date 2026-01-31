class BaseResponse<T> {
  constructor() {
    this._isSuccess = false;
    this._body = null;
    this._message = "";
  }

  private _isSuccess: boolean;
  public get isSuccess(): boolean {
    return this._isSuccess;
  }
  public set isSuccess(v: boolean) {
    this._isSuccess = v;
  }

  private _message: string;
  public get message(): string {
    return this._message;
  }
  public set message(v: string) {
    this._message = v;
  }

  private _body: T | null;
  public get body(): T | null {
    return this._body;
  }
  public set body(v: T | null) {
    this._body = v;
  }

  toJSON() {
    return {
      isSuccess: this.isSuccess,
      body: this.body,
      message: this.message,
    };
  }
}

export default BaseResponse;
