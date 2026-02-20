import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import { DBReport } from "@/app/models/Report";
import Logs from "../../utilities/Logs";
import ReportsBll from "../../logic/bll/reportsBll";

const log: Logs = new Logs();

export const GET = withRoles(["ADMIN"], async (req: Request) => {
  let response: BaseResponse<DBReport[]> = new BaseResponse<DBReport[]>();

  try {
    const { searchParams } = new URL(req.url);
    const dayParam = searchParams.get("day") ?? "";
    const hourParam = (searchParams.get("hour") ?? "").trim();

    const day = Number(dayParam);
    const isDayValid = Number.isInteger(day) && day >= 0 && day <= 6;
    const isHourValid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(hourParam);

    if (!isDayValid || !isHourValid) {
      response.isSuccess = false;
      response.message = "Invalid day/hour parameters.";
      return NextResponse.json(response, { status: 400 });
    }

    const bll = new MainBll();
    response = await bll.GetReportsToExecuteBySchedule(day, hourParam);
  } catch (err) {
    response.isSuccess = false;
    response.message =
      "An unexpected error occurred while loading scheduled reports.";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});

export const POST = withRoles(["ADMIN"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();

  try {
    const { searchParams } = new URL(req.url);
    const reportId = (searchParams.get("reportId") ?? "").trim();

    if (!reportId) {
      response.isSuccess = false;
      response.message = "reportId is required.";
      return NextResponse.json(response, { status: 400 });
    }

    const bll = new ReportsBll();
    response = await bll.ExecuteAndSendScheduledReport(reportId);
  } catch (err) {
    response.isSuccess = false;
    response.message =
      "An unexpected error occurred while executing the scheduled report.";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});
