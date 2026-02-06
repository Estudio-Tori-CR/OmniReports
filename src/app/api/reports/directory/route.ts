import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";
import { DirectoryReports } from "@/app/models/directory";

const log: Logs = new Logs();

export const GET = withRoles(
  ["ADMIN", "DEVELOPER", "REPORTS"],
  async (req: Request) => {
    let response: BaseResponse<DirectoryReports[]> = new BaseResponse<
      DirectoryReports[]
    >();
    try {
      const bll: MainBll = new MainBll();
      response = await bll.GetDirectories();
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while loading directories.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
