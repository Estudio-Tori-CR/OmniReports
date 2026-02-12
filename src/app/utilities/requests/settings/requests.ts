import { SettingsPassword } from "@/app/models/settings";
import Client from "../../Client";
import { useRouter } from "next/navigation";
import BaseResponse from "@/app/models/baseResponse";

class SettingsReq {
  private client: Client;

  constructor(router: ReturnType<typeof useRouter>) {
    this.client = new Client(router);
  }

  public async GetPasswordSettings(): Promise<BaseResponse<SettingsPassword>> {
    const result = await this.client.Get<SettingsPassword>(`settings/password`);

    return result;
  }
}

export default SettingsReq;
