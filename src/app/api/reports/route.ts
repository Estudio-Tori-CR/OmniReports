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
      const bll: MainBll = new MainBll();
      response = await bll.GetReports(null);
    } catch (err) {
      response.isSuccess = false;
      response.message = "Unexpected error";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
