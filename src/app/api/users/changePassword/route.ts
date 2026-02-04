import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import UserModel, { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

export const PUT = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    let response: BaseResponse<null> = new BaseResponse<null>();
    try {
      const bll: MainBll = new MainBll();
      const body: User = Object.assign(new UserModel(), await req.json());
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get("userId");

      // Fallback por headers si estás detrás de proxy
      const xff = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");

      const clientIp = (xff ? xff.split(",")[0].trim() : null) ?? realIp ?? "unknown";

      response = await bll.ChangePassword(userId as string, body, clientIp);
    } catch (err) {
      response.isSuccess = false;
      response.message = "Unexpected error";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
