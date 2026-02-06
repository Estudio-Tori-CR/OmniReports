import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    let response: BaseResponse<User> = new BaseResponse<User>();
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get("userId");
      const bll: MainBll = new MainBll();
      response = await bll.GetUser(userId as string);
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while loading user details.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
