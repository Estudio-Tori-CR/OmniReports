/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import ReportsBll from "../../logic/bll/reportsBll";
import { ExecuteReport } from "@/app/models/executeReport";
import Logs from "../../utilities/Logs";
import { randomUUID } from "crypto";
import { PendingExportReport } from "@/app/models/exportReports";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    let response: BaseResponse<PendingExportReport> =
      new BaseResponse<PendingExportReport>();
    try {
      const bll = new ReportsBll();
      const { searchParams } = new URL(req.url);
      const reportId = searchParams.get("reportId");
      response = await bll.DownloadExport(reportId as string);
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while executing the report.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);

export const POST = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    const response: BaseResponse<string> = new BaseResponse<string>();
    try {
      const bll = new ReportsBll();
      const body: ExecuteReport = Object.assign(
        new ExecuteReport(),
        await req.json(),
      );
      const reportId = randomUUID();

      await bll.ProcessExport(body, reportId);

      response.body = reportId;
      response.isSuccess = true;
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while executing the report.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
