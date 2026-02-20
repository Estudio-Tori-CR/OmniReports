import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";
import { JWTPayload } from "jose";

const log: Logs = new Logs();

export const PUT = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request, _ctx, payload: JWTPayload) => {
    let response: BaseResponse<null> = new BaseResponse<null>();
    try {
      const bll: MainBll = new MainBll();
      const body = (await req.json()) as { password?: string };
      const { searchParams } = new URL(req.url);
      const requestedUserId = searchParams.get("userId");

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

      if (requestedUserId && requestedUserId !== sessionUserId) {
        response.isSuccess = false;
        response.message =
          "You are not allowed to change another user's password.";
        return NextResponse.json(response, { status: 403 });
      }

      const newPassword = body.password?.toString().trim() ?? "";
      if (!newPassword) {
        response.isSuccess = false;
        response.message = "The new password is required.";
        return NextResponse.json(response, { status: 400 });
      }

      const xff = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const clientIp =
        (xff ? xff.split(",")[0].trim() : null) ?? realIp ?? "unknown";

      response = await bll.ChangePassword(sessionUserId, newPassword, clientIp);
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while changing the password.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
