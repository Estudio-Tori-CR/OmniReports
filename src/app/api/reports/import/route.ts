/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import { ExportReport } from "@/app/models/Report";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

export const POST = withRoles(
  ["ADMIN", "DEVELOPER"],
  async (req: Request, ctx: RouteContext<any>, user: string) => {
    let response: BaseResponse<null> = new BaseResponse<null>();
    try {
      log.Binnacle(user, "", `${req.method} ${new URL(req.url).pathname}`);
      const bll: MainBll = new MainBll();
      const body: ExportReport = await req.json();
      response = await bll.ImportReport(body);
    } catch (err) {
      console.error(err);
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while importing the report.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
