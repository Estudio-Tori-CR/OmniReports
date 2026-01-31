import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import UserModel, { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";

export const PUT = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    let response: BaseResponse<null> = new BaseResponse<null>();
    try {
      debugger;
      const bll: MainBll = new MainBll();
      const body: User = Object.assign(new UserModel(), await req.json());
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get("userId");
      response = await bll.ChnagePassword(userId as string, body);
    } catch (err) {
      response.isSuccess = false;
      response.message = "Unexpected error";
    }

    return NextResponse.json(response);
  },
);
