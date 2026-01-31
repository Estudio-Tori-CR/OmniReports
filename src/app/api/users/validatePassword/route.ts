import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import UserModel, { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";

export const POST = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    let response: BaseResponse<User> = new BaseResponse<User>();
    try {
      const bll: MainBll = new MainBll();
      const body = await req.json();
      response = await bll.ValidatePassword(body.currentPassword, body.userId);
    } catch (err) {
      response.isSuccess = false;
      response.message = "Unexpected error";
    }

    return NextResponse.json(response);
  },
);
