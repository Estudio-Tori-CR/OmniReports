import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";
import { JWTPayload } from "jose";

const log: Logs = new Logs();

export const POST = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request, _ctx, payload: JWTPayload) => {
    let response: BaseResponse<User> = new BaseResponse<User>();
    try {
      const bll: MainBll = new MainBll();
      const body = (await req.json()) as { currentPassword?: string };

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

      const currentPassword = body.currentPassword?.toString() ?? "";
      response = await bll.ValidatePassword(currentPassword, sessionUserId);
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while validating the current password.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
