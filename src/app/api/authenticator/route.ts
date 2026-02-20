import BaseResponse from "@/app/models/baseResponse";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import Logs from "../utilities/Logs";
import MainBll from "../logic/bll/mainBll";

const JWT_NAME = "session";
const JWT_SECRET = process.env.JWT_SECRET!;

const secretKey = new TextEncoder().encode(JWT_SECRET);

const BOOTSTRAP_EXPIRES_SECONDS = parseInt(
  process.env.BOOTSTRAP_EXPIRES_SECONDS ?? "300",
);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const log: Logs = new Logs();

export const POST = async (req: Request) => {
  const response: BaseResponse<null> = new BaseResponse<null>();
  try {
    const bll = new MainBll();
    const canBootstrap = await bll.CanBootstrap();
    if (!canBootstrap) {
      response.isSuccess = false;
      response.message = "Bootstrap is disabled because users already exist.";
      return NextResponse.json(response, { status: 403 });
    }

    const expectedBootstrapToken = process.env.BOOTSTRAP_TOKEN ?? "";
    const providedBootstrapToken = req.headers.get("x-bootstrap-token") ?? "";

    if (!expectedBootstrapToken) {
      response.isSuccess = false;
      response.message = "BOOTSTRAP_TOKEN is not configured.";
      return NextResponse.json(response, { status: 500 });
    }

    if (providedBootstrapToken !== expectedBootstrapToken) {
      response.isSuccess = false;
      response.message = "Unauthorized bootstrap request.";
      return NextResponse.json(response, { status: 401 });
    }

    const payload = {
      sub: "bootstrap@omnireports.local",
      roles: ["BOOTSTRAP"],
      bootstrap: true,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${BOOTSTRAP_EXPIRES_SECONDS}s`)
      .sign(secretKey);

    response.isSuccess = true;
    response.message = "Bootstrap session token generated.";

    const res = NextResponse.json(response, { status: 200 });
    res.cookies.set(JWT_NAME, token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      path: "/",
      maxAge: BOOTSTRAP_EXPIRES_SECONDS,
    });
    return res;
  } catch (err) {
    response.isSuccess = false;
    response.message =
      "An unexpected error occurred while creating the session token.";
    log.log(err as string, "error");
  }

  return NextResponse.json(response);
};
