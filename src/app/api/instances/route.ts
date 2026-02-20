import { NextResponse } from "next/server";
import { withRoles } from "../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../logic/bll/mainBll";
import { Instance } from "@/app/models/Instance";
import Logs from "../utilities/Logs";
import { JWTPayload } from "jose";
import { Role } from "@/app/interfaces/Roles";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER"],
  async (req: Request, _ctx, payload: JWTPayload) => {
    let response: BaseResponse<Instance[]> = new BaseResponse<Instance[]>();
    try {
      const { searchParams } = new URL(req.url);
      const isExport = searchParams.get("isExport")?.toString() === "true";
      const roles = (payload.roles ?? []) as Role[];
      const isAdmin = roles.includes("ADMIN");
      if (isExport && !isAdmin) {
        response.isSuccess = false;
        response.message =
          "Only ADMIN can export instance connection details.";
        return NextResponse.json(response, { status: 403 });
      }

      const bll: MainBll = new MainBll();
      response = await bll.GetInstances(null, isExport && isAdmin);
    } catch (err) {
      response.isSuccess = false;
      response.message = "An unexpected error occurred while loading instances.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
