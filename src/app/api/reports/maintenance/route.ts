import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import ReportModel, { DBReport } from "@/app/models/Report";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

export const POST = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll: MainBll = new MainBll();
    const body: DBReport = Object.assign(new ReportModel(), await req.json());
    response = await bll.InsertReport(body);
  } catch (err) {
    console.error(err);
    response.isSuccess = false;
    response.message = "Unexpected error";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});

export const PUT = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll: MainBll = new MainBll();
    const body: DBReport = Object.assign(new ReportModel(), await req.json());
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");
    response = await bll.UpdateReport(reportId as string, body);
  } catch (err) {
    response.isSuccess = false;
    response.message = "Unexpected error";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});
