import { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import BaseResponse from "@/app/models/baseResponse";
import { NextResponse } from "next/server";
import Logs from "../../utilities/Logs";
import { SignJWT } from "jose";
import { PREAUTH_JWT_NAME } from "../../middleware";

const log: Logs = new Logs();
const JWT_SECRET = process.env.JWT_SECRET!;
const secretKey = new TextEncoder().encode(JWT_SECRET);
const PREAUTH_EXPIRES_SECONDS = parseInt(
  process.env.PREAUTH_EXPIRES_SECONDS ?? "300",
);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const POST = async (req: Request) => {
  let response: BaseResponse<User> = new BaseResponse<User>();
  try {
    const bll: MainBll = new MainBll();
    const { email, password } = await req.json();
    response = await bll.LogIn(email, password);

    if (response.isSuccess && response.body?._id) {
      const payload = {
        sub: response.body.email,
        email: response.body.email,
        userId: response.body._id.toString(),
        stage: "mfa",
      };

      const preauthToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${PREAUTH_EXPIRES_SECONDS}s`)
        .sign(secretKey);

      const res = NextResponse.json(response);
      res.cookies.set(PREAUTH_JWT_NAME, preauthToken, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: "lax",
        path: "/",
        maxAge: PREAUTH_EXPIRES_SECONDS,
      });
      return res;
    }
  } catch (err) {
    response.isSuccess = false;
    response.message = "An unexpected error occurred while signing in.";
    log.log(err as string, "error");
  }

  const res = NextResponse.json(response);
  res.cookies.set(PREAUTH_JWT_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
};
