import { NextResponse } from "next/server";
import { withRoles } from "../../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../../logic/bll/mainBll";
import Logs from "../../../utilities/Logs";
import DirectoryReportsModel, {
  DirectoryReports,
} from "@/app/models/directory";

const log: Logs = new Logs();

export const POST = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll: MainBll = new MainBll();
    const body: DirectoryReports = Object.assign(
      new DirectoryReportsModel(),
      await req.json(),
    );
    response = await bll.InsertDirectory(body);
  } catch (err) {
    console.error(err);
    response.isSuccess = false;
    response.message =
      "An unexpected error occurred while creating the directory.";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});

export const PUT = withRoles(["ADMIN", "DEVELOPER"], async (req: Request) => {
  let response: BaseResponse<null> = new BaseResponse<null>();
  try {
    // const bll: MainBll = new MainBll();
    // const body: DirectoryReports = Object.assign(new ReportModel(), await req.json());
    // const { searchParams } = new URL(req.url);
    // const directoryId = searchParams.get("directoryId");
    // response = await bll.UpdateReport(directoryId as string, body);
  } catch (err) {
    response.isSuccess = false;
    response.message =
      "An unexpected error occurred while updating the directory.";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
});
