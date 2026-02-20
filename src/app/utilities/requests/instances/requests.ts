import BaseResponse from "@/app/models/baseResponse";
import Client from "../../Client";
import { Instance, InstanceInt } from "@/app/models/Instance";
import { useRouter } from "next/navigation";

class IntancesReq {
  private client: Client;

  constructor(router: ReturnType<typeof useRouter>) {
    this.client = new Client(router);
  }

  public async Insert(body: InstanceInt): Promise<BaseResponse<null>> {
    const result = await this.client.Post<InstanceInt, null>(
      `instances/maintenance`,
      body,
    );

    return result;
  }

  public async Update(
    instanceId: string | undefined,
    body: InstanceInt,
  ): Promise<BaseResponse<null>> {
    const result = await this.client.Put<InstanceInt, null>(
      `instances/maintenance?instanceId=${instanceId}`,
      body,
    );

    return result;
  }

  public async GetOne(instanceId: string): Promise<BaseResponse<Instance>> {
    const result = await this.client.Get<Instance>(
      `instances/findOne?instanceId=${instanceId}`,
    );

    return result;
  }

  public async GetAll(
    isExport: boolean = false,
  ): Promise<BaseResponse<Instance[]>> {
    const result = await this.client.Get<Instance[]>(
      `instances?isExport=${isExport}`,
    );

    return result;
  }
}

export default IntancesReq;
