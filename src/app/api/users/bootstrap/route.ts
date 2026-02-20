import { NextResponse } from "next/server";
import { withRoles } from "../../middleware";
import BaseResponse from "@/app/models/baseResponse";
import UserModel, { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import Logs from "../../utilities/Logs";

const log: Logs = new Logs();

type BootstrapPayload = {
  bootstrap?: boolean;
};

export const POST = withRoles(
  ["BOOTSTRAP"],
  async (req: Request, _ctx, payload) => {
    let response: BaseResponse<null> = new BaseResponse<null>();
    try {
      const claims = payload as BootstrapPayload;
      if (claims.bootstrap !== true) {
        response.isSuccess = false;
        response.message = "Forbidden bootstrap token.";
        return NextResponse.json(response, { status: 403 });
      }

      const bll: MainBll = new MainBll();
      const body: User = Object.assign(new UserModel(), await req.json());
      response = await bll.BootstrapCreateFirstUser(body);

      return NextResponse.json(response, {
        status: response.isSuccess ? 200 : 400,
      });
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while creating the initial admin user.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response, { status: 500 });
  },
);
