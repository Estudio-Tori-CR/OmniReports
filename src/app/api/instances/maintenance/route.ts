import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import InstanceModel, { Instance } from "@/app/models/Instance";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

export const POST = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<string> = new BaseResponse<string>();
  try {
    const bll: MainBll = new MainBll();
    const body: Instance = Object.assign(new InstanceModel(), await req.json());
    response = await bll.InsertInstance(body);
  } catch (err) {
    console.error(err);
    response.isSuccess = false;
    response.message = "Unexpected error";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});

export const PUT = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll: MainBll = new MainBll();
    const body: Instance = Object.assign(new InstanceModel(), await req.json());
    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get("instanceId");
    response = await bll.UpdateInstance(instanceId as string, body);
  } catch (err) {
    response.isSuccess = false;
    response.message = "Unexpected error";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});
