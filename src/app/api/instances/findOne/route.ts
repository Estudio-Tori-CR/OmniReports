import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import { Instance } from "@/app/models/Instance";
import Logs from "../../utilities/Logs";
import { JWTPayload } from "jose";
import { Role } from "@/app/interfaces/Roles";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER"],
  async (req: Request, ctx, payload) => {
    let response: BaseResponse<Instance> = new BaseResponse<Instance>();
    try {
      const { searchParams } = new URL(req.url);
      const instanceId = searchParams.get("instanceId");
      const bll: MainBll = new MainBll();
      response = await bll.GetInstance(
        instanceId as string,
        (payload.roles as Role[]).includes("ADMIN"),
      );
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while loading instance details.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
