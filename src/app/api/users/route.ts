import { NextResponse } from "next/server";
import { withRoles } from "../middleware";
import BaseResponse from "@/app/models/baseResponse";
import UserModel, { User } from "@/app/models/User";
import MainBll from "../logic/bll/mainBll";

export const GET = withRoles(["ADMIN"], async (req: Request) => {
  let response: BaseResponse<User[]> = new BaseResponse<User[]>();
  try {
    const bll: MainBll = new MainBll();
    response = await bll.GetUsers(null);
  } catch (err) {
    response.isSuccess = false;
    response.message = "Unexpected error";
  }

  return NextResponse.json(response);
});
