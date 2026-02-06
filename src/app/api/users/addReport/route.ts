import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

export const POST = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll: MainBll = new MainBll();
    const { reportId, usersId } = await req.json();
    response = await bll.AddReportToUser(reportId, usersId);
  } catch (err) {
    response.isSuccess = false;
    response.message =
      "An unexpected error occurred while updating report access.";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});
