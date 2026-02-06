import { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import BaseResponse from "@/app/models/baseResponse";
import { NextResponse } from "next/server";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

export const POST = async (req: Request) => {
  let response: BaseResponse<User> = new BaseResponse<User>();
  try {
    const bll: MainBll = new MainBll();
    const { email, password } = await req.json();
    response = await bll.LogIn(email, password);
  } catch (err) {
    response.isSuccess = false;
    response.message = "An unexpected error occurred while signing in.";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
};
