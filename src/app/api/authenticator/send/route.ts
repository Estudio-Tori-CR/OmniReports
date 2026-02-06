import BaseResponse from "@/app/models/baseResponse";
import { NextResponse } from "next/server";
import Logs from "../../utilities/Logs";
import MainBll from "../../logic/bll/mainBll";
import { AuthenticatorResp } from "@/app/models/authenticator";

const log: Logs = new Logs();

export const POST = async (req: Request) => {
  let response: BaseResponse<AuthenticatorResp> =
    new BaseResponse<AuthenticatorResp>();
  try {
    const bll: MainBll = new MainBll();
    const { userId } = await req.json();

    // Fallback por headers si estás detrás de proxy
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
};
