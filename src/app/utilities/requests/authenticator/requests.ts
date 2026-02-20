import BaseResponse from "@/app/models/baseResponse";
import Client from "../../Client";
import { AuthenticatorResp } from "@/app/models/authenticator";
import { useRouter } from "next/navigation";

class AuthenticatorReq {
  private client: Client;

  constructor(router: ReturnType<typeof useRouter>) {
    this.client = new Client(router);
  }

  public async Send(): Promise<BaseResponse<AuthenticatorResp>> {
    const result = await this.client.Post<Record<string, never>, AuthenticatorResp>(
      `authenticator/send`,
      {},
    );

    return result;
  }

  public async Validate(token: string): Promise<BaseResponse<null>> {
    const result = await this.client.Post<{ token: string }, null>(
      `authenticator/validate`,
      {
      token,
      },
    );

    return result;
  }
}

export default AuthenticatorReq;
