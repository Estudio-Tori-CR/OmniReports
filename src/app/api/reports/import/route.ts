import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import { ExportReport } from "@/app/models/Report";

export const POST = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll: MainBll = new MainBll();
    const body: ExportReport = await req.json();
    response = await bll.ImportReport(body);
  } catch (err) {
    console.error(err);
    response.isSuccess = false;
    response.message = "Unexpected error";
  }

  return NextResponse.json(response);
});
