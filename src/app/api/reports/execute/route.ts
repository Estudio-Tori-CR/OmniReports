/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import ReportsBll from "../../logic/bll/reportsBll";
import { ExecuteReport, ExecuteReportResult } from "@/app/models/executeReport";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

export const POST = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    let response: BaseResponse<ExecuteReportResult> =
      new BaseResponse<ExecuteReportResult>();
    try {
      const bll = new ReportsBll();
      const body: ExecuteReport = Object.assign(
        new ExecuteReport(),
        await req.json(),
      );
      response = await bll.ExecuteOne(body);
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while executing the report.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
