import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import UserModel, { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";

export const POST = withRoles(["ADMIN"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll: MainBll = new MainBll();
    const body: User = Object.assign(new UserModel(), await req.json());
    response = await bll.InserUser(body);
  } catch (err) {
    response.isSuccess = false;
    response.message = "Unexpected error";
  }

  return NextResponse.json(response);
});

export const PUT = withRoles(["ADMIN"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll: MainBll = new MainBll();
    const body: User = Object.assign(new UserModel(), await req.json());
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    response = await bll.UpdateUser(userId as string, body);
  } catch (err) {
    response.isSuccess = false;
    response.message = "Unexpected error";
  }

  return NextResponse.json(response);
});
