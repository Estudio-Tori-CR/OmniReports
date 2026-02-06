import { NextResponse } from "next/server";
import { withRoles } from "../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../logic/bll/mainBll";
import { DBReport } from "@/app/models/Report";
import Logs from "../utilities/Logs";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    let response: BaseResponse<DBReport[]> = new BaseResponse<DBReport[]>();
    try {
      const { searchParams } = new URL(req.url);
      const filter = searchParams.get("filter");
      const userId = searchParams.get("userId");
      const bll: MainBll = new MainBll();
      response = await bll.GetReports(filter ? JSON.parse(filter) : null, userId as string);
    } catch (err) {
      response.isSuccess = false;
      response.message = "An unexpected error occurred while loading reports.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
