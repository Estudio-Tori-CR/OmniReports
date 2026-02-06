import BaseResponse from "@/app/models/baseResponse";
import Client from "../../Client";
import type { User, UserInt } from "../../../models/User";
import { AuthenticatorResp } from "@/app/models/authenticator";

class AuthenticatorReq {
  client = new Client();

  public async Send(userId: string): Promise<BaseResponse<AuthenticatorResp>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.client.Post<any, AuthenticatorResp>(
      `authenticator/send`,
      {
        userId,
      },
    );

    return result;
  }

  public async Validate(
    userId: string,
    token: string,
  ): Promise<BaseResponse<null>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.client.Post<any, null>(`authenticator/validate`, {
      userId,
      token,
    });

    return result;
  }
}

export default AuthenticatorReq;
