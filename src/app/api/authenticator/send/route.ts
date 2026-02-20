import BaseResponse from "@/app/models/baseResponse";
import { NextResponse } from "next/server";
import Logs from "../../utilities/Logs";
import MainBll from "../../logic/bll/mainBll";
import { AuthenticatorResp } from "@/app/models/authenticator";
import { withPreAuth } from "../../middleware";
import { JWTPayload } from "jose";

const log: Logs = new Logs();

export const POST = withPreAuth(
  async (req: Request, _ctx, payload: JWTPayload) => {
    let response: BaseResponse<AuthenticatorResp> =
      new BaseResponse<AuthenticatorResp>();
    try {
      const bll: MainBll = new MainBll();
      const userId = String(payload.userId ?? "").trim();
      if (!userId) {
        response.isSuccess = false;
        response.message = "Unauthorized.";
        return NextResponse.json(response, { status: 401 });
      }

      const xff = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const clientIp =
        (xff ? xff.split(",")[0].trim() : null) ?? realIp ?? "unknown";

      response = await bll.SendAuthenticator(userId, clientIp);
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while sending the verification code.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
