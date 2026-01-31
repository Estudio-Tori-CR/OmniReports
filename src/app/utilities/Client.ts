import axios, { AxiosResponse } from "axios";
import BaseResponse from "../models/baseResponse";
import { getToken } from "./Middleware";
import Loader from "../pages/components/loading";
import Message from "../pages/components/popups";

class Client {
  private message: Message;

  constructor() {
    this.message = new Message();
  }

  private async getAuthHeader() {
    const cookiesToken = await getToken();
    return cookiesToken ? { Authorization: `Bearer ${cookiesToken}` } : {};
  }

  public async Get<T>(
    query: string,
    showLoading: boolean = true,
    hideLoading: boolean = true,
    params?: Record<string, string | number | null>,
  ): Promise<BaseResponse<T>> {
    if (showLoading) {
      Loader().show();
    }
    const result: AxiosResponse = await axios.get(`/api/${query}`, {
      params: params,
      headers: await this.getAuthHeader(),
    });
    const respose = result.data as BaseResponse<T>;
    if (hideLoading) {
      Loader().hidde();
    }

    if (!respose.isSuccess) {
      this.message.Toast({ icon: "error", title: respose.message });
    }

    return respose;
  }

  public async Post<T, T1>(
    query: string,
    json: T,
    showLoading: boolean = true,
    hideLoading: boolean = true,
  ): Promise<BaseResponse<T1>> {
    axios.defaults.withCredentials = true;
    if (showLoading) {
      Loader().show();
    }
    let respose: BaseResponse<T1> = new BaseResponse<T1>();
    try {
      const result: AxiosResponse = await axios.post(`/api/${query}`, json, {
        headers: await this.getAuthHeader(),
      });
      respose = result.data as BaseResponse<T1>;
    } catch (err) {
      respose.isSuccess = false;
    }
    if (hideLoading) {
      Loader().hidde();
    }

    if (!respose.isSuccess) {
      this.message.Toast({ icon: "error", title: respose.message });
    }

    return respose;
  }

  public async Put<T, T1>(
    query: string,
    json: T,
    showLoading: boolean = true,
    hideLoading: boolean = true,
  ): Promise<BaseResponse<T1>> {
    axios.defaults.withCredentials = true;
    if (showLoading) {
      Loader().show();
    }
    let respose: BaseResponse<T1> = new BaseResponse<T1>();
    try {
      const result: AxiosResponse = await axios.put(`/api/${query}`, json, {
        headers: await this.getAuthHeader(),
      });
      respose = result.data as BaseResponse<T1>;
    } catch (err) {
      respose.isSuccess = false;
    }

    if (hideLoading) {
      Loader().hidde();
    }

    if (!respose.isSuccess) {
      this.message.Toast({ icon: "error", title: respose.message });
    }

    return respose;
  }
}

export default Client;
