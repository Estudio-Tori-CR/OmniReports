/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import ReportsBll from "../../logic/bll/reportsBll";
import { ExecuteReport } from "@/app/models/executeReport";
import Logs from "../../utilities/Logs";
import { randomUUID } from "crypto";
import { PendingExportReport } from "@/app/models/exportReports";
import { JWTPayload } from "jose";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request, _ctx, payload: JWTPayload) => {
    let response: BaseResponse<PendingExportReport> =
      new BaseResponse<PendingExportReport>();
    try {
      const bll = new ReportsBll();
      const { searchParams } = new URL(req.url);
      const reportId = searchParams.get("reportId");
      const owner = String(payload.email ?? payload.sub ?? "").trim();
      if (!owner) {
        response.isSuccess = false;
        response.message = "Unauthorized.";
        return NextResponse.json(response, { status: 401 });
      }

      response = await bll.DownloadExport(reportId as string, owner);
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
  async (req: Request, _ctx, payload: JWTPayload) => {
    const response: BaseResponse<string> = new BaseResponse<string>();
    try {
      const bll = new ReportsBll();
      const body: ExecuteReport = Object.assign(
        new ExecuteReport(),
        await req.json(),
      );
      const reportId = randomUUID();
      const owner = String(payload.email ?? payload.sub ?? "").trim();
      if (!owner) {
        response.isSuccess = false;
        response.message = "Unauthorized.";
        return NextResponse.json(response, { status: 401 });
      }

      await bll.ProcessExport(body, reportId, owner);

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
