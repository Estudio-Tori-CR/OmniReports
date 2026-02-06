import axios, { AxiosResponse } from "axios";
import BaseResponse from "../models/baseResponse";
import { getToken } from "./Middleware";
import Loader from "../pages/components/loading";
import Message from "../pages/components/popups";
import { useRouter } from "next/navigation";

class Client {
  private message: Message;
  private router: ReturnType<typeof useRouter>;

  constructor(router: ReturnType<typeof useRouter>) {
    this.message = new Message();
    this.router = router;
  }

  private async handle401() {
    await this.message.Alert({
      icon: "warning",
      title: "Session Expired",
      message: "Your session has expired. Please sign in again.",
      callback: async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.router?.replace("/") ?? window.location.assign("/");
      },
    });
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
    try {
      if (showLoading) {
        Loader().show();
      }
      const result: AxiosResponse = await axios.get(`/api/${query}`, {
        params: params,
        headers: await this.getAuthHeader(),
      });
      const respose = result.data as BaseResponse<T>;

      if (!respose.isSuccess) {
        this.message.Toast({ icon: "error", title: respose.message });
      }

      return respose;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401) {
          await this.handle401();
        } else {
          this.message.Toast({
            icon: "error",
            title: "Request error",
          });
        }
      } else {
        this.message.Toast({
          icon: "error",
          title: "Unexpected error",
        });
      }

      throw error;
    } finally {
      if (hideLoading) {
        Loader().hidde();
      }
    }
  }

  public async Post<T, T1>(
    query: string,
    json: T,
    showLoading: boolean = true,
    hideLoading: boolean = true,
  ): Promise<BaseResponse<T1>> {
    try {
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

      if (!respose.isSuccess) {
        this.message.Toast({ icon: "error", title: respose.message });
      }

      return respose;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401) {
          await this.handle401();
        } else {
          this.message.Toast({
            icon: "error",
            title: "Request error",
          });
        }
      } else {
        this.message.Toast({
          icon: "error",
          title: "Unexpected error",
        });
      }

      throw error;
    } finally {
      if (hideLoading) {
        Loader().hidde();
      }
    }
  }

  public async Put<T, T1>(
    query: string,
    json: T,
    showLoading: boolean = true,
    hideLoading: boolean = true,
  ): Promise<BaseResponse<T1>> {
    try {
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

      if (!respose.isSuccess) {
        this.message.Toast({ icon: "error", title: respose.message });
      }

      return respose;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401) {
          await this.handle401();
        } else {
          this.message.Toast({
            icon: "error",
            title: "Request error",
          });
        }
      } else {
        this.message.Toast({
          icon: "error",
          title: "Unexpected error",
        });
      }

      throw error;
    } finally {
      if (hideLoading) {
        Loader().hidde();
      }
    }
  }
}

export default Client;
