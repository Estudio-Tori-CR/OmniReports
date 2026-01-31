import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import UserModel, { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";

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
      response.message = "Unexpected error";
    }

    return NextResponse.json(response);
  },
);
