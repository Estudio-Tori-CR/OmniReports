import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import { DBReport } from "@/app/models/Report";

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORT"],
  async (req: Request) => {
    let response: BaseResponse<DBReport> = new BaseResponse<DBReport>();
    try {
      const { searchParams } = new URL(req.url);
      const reportId = searchParams.get("reportId");
      const bll: MainBll = new MainBll();
      response = await bll.GetReport(reportId as string);
    } catch (err) {
      response.isSuccess = false;
      response.message = "Unexpected error";
    }

    return NextResponse.json(response);
  },
);
