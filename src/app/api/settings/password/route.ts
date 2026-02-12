import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";
import { SettingsPassword } from "@/app/models/settings";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    const response: BaseResponse<SettingsPassword> =
      new BaseResponse<SettingsPassword>();
    try {
      response.isSuccess = true;
      response.body = {
        length: parseInt(process.env.PASSWORD_LENGTH ?? "8"),
        low: process.env.PASSWORD_LOW as string,
        medium: process.env.PASSWORD_MEDIUM as string,
        high: process.env.PASSWORD_HIGH as string,
      };
    } catch (err) {
      response.isSuccess = false;
      response.message = "An unexpected error occurred while loading settings.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
