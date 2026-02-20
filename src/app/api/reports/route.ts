import { NextResponse } from "next/server";
import { withRoles } from "../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../logic/bll/mainBll";
import { DBReport } from "@/app/models/Report";
import Logs from "../utilities/Logs";
import { JWTPayload } from "jose";
import { Role } from "@/app/interfaces/Roles";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request, _ctx, payload: JWTPayload) => {
    let response: BaseResponse<DBReport[]> = new BaseResponse<DBReport[]>();
    try {
      const roles = (payload.roles ?? []) as Role[];
      const sessionEmail = String(payload.email ?? payload.sub ?? "").trim();
      if (!sessionEmail) {
        response.isSuccess = false;
        response.message = "Unauthorized.";
        return NextResponse.json(response, { status: 401 });
      }

      const bll: MainBll = new MainBll();
      const sessionUser = await bll.GetUserByEmail(sessionEmail);
      const sessionUserId = sessionUser?._id?.toString() ?? "";
      if (!sessionUser || !sessionUserId) {
        response.isSuccess = false;
        response.message = "Unauthorized.";
        return NextResponse.json(response, { status: 401 });
      }

      response = await bll.GetReports(roles ? roles : null, sessionUserId);
    } catch (err) {
      response.isSuccess = false;
      response.message = "An unexpected error occurred while loading reports.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
