import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import { Instance } from "@/app/models/Instance";

export const GET = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<Instance> = new BaseResponse<Instance>();
  try {
    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get("instanceId");
    const bll: MainBll = new MainBll();
    response = await bll.GetInstance(instanceId as string);
  } catch (err) {
    response.isSuccess = false;
    response.message = "Unexpected error";
  }

  return NextResponse.json(response);
});
