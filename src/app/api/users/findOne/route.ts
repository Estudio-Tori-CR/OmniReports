import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";
import { JWTPayload } from "jose";
import { Role } from "@/app/interfaces/Roles";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request, _ctx, payload: JWTPayload) => {
    let response: BaseResponse<User> = new BaseResponse<User>();
    try {
      const { searchParams } = new URL(req.url);
      const requestedUserId = searchParams.get("userId");
      const bll: MainBll = new MainBll();

      const sessionEmail = String(payload.email ?? payload.sub ?? "").trim();
      if (!sessionEmail) {
        response.isSuccess = false;
        response.message = "Unauthorized.";
        return NextResponse.json(response, { status: 401 });
      }

      const sessionUser = await bll.GetUserByEmail(sessionEmail);
      const sessionUserId = sessionUser?._id?.toString() ?? "";
      if (!sessionUser || !sessionUserId) {
        response.isSuccess = false;
        response.message = "Unauthorized.";
        return NextResponse.json(response, { status: 401 });
      }

      const roles = (payload.roles ?? []) as Role[];
      const isAdmin = roles.includes("ADMIN");
      const userId = isAdmin ? requestedUserId ?? sessionUserId : sessionUserId;

      if (!isAdmin && requestedUserId && requestedUserId !== sessionUserId) {
        response.isSuccess = false;
        response.message = "Forbidden.";
        return NextResponse.json(response, { status: 403 });
      }

      response = await bll.GetUser(userId);
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while loading user details.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
