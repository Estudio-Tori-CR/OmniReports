import BaseResponse from "@/app/models/baseResponse";
import Client from "../../Client";
import type { User, UserInt } from "../../../models/User";
import { useRouter } from "next/navigation";

class UsersReq {
  private client: Client;

  constructor(router: ReturnType<typeof useRouter>) {
    this.client = new Client(router);
  }

  public async LogIn(
    email: string,
    password: string,
  ): Promise<BaseResponse<User>> {
    const result = await this.client.Post<User, User>(`users/logIn`, {
      email,
      password,
      firstName: "",
      lastName: "",
      roles: "",
      reports: [],
      countIntents: 0,
      isActive: false,
    });

    return result;
  }

  public async Insert(body: UserInt): Promise<BaseResponse<null>> {
    const result = await this.client.Post<UserInt, null>(
      `users/maintenance`,
      body,
    );

    return result;
  }

  public async Update(
    userId: string | undefined,
    body: UserInt,
  ): Promise<BaseResponse<null>> {
    const result = await this.client.Put<UserInt, null>(
      `users/maintenance?userId=${userId}`,
      body,
    );

    return result;
  }

  public async GetOne(userId: string): Promise<BaseResponse<User>> {
    const result = await this.client.Get<User>(
      `users/findOne?userId=${userId}`,
    );

    return result;
  }

  public async GetAll(filter: string): Promise<BaseResponse<User[]>> {
    const result = await this.client.Get<User[]>("users/");

    return result;
  }

  public async ValidatePassword(
    currentPassword: string,
    userId: string,
  ): Promise<BaseResponse<User>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.client.Post<any, User>("users/validatePassword", {
      currentPassword,
      userId,
    });

    return result;
  }

  public async ChangePassword(
    userId: string | undefined,
    body: UserInt,
  ): Promise<BaseResponse<null>> {
    const result = await this.client.Put<UserInt, null>(
      `users/changePassword?userId=${userId}`,
      body,
    );

    return result;
  }

  public async GeneratePassword(
    userId: string | undefined,
  ): Promise<BaseResponse<null>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.client.Put<any, null>(
      `users/generatePassword?userId=${userId}`,
      {},
    );

    return result;
  }

  public async AddReport(
    reportId: string,
    usersId: string[],
  ): Promise<BaseResponse<string>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.client.Post<any, string>(`users/addReport`, {
      reportId,
      usersId,
    });

    return result;
  }
}

export default UsersReq;
