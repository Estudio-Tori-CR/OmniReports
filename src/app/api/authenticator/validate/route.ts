import BaseResponse from "@/app/models/baseResponse";
import { NextResponse } from "next/server";
import MainBll from "../../logic/bll/mainBll";
import { User } from "@/app/models/User";
import { SignJWT, JWTPayload } from "jose";
import Logs from "../../utilities/Logs";
import { JWT_NAME, PREAUTH_JWT_NAME, withPreAuth } from "../../middleware";

const JWT_SECRET = process.env.JWT_SECRET!;
const secretKey = new TextEncoder().encode(JWT_SECRET);
const EXPIRES_SECONDS = parseInt(process.env.EXPIRES_SECONDS as string);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const log: Logs = new Logs();

export const POST = withPreAuth(
  async (req: Request, _ctx, payload: JWTPayload) => {
    let response: BaseResponse<User> = new BaseResponse<User>();
    try {
      const bll: MainBll = new MainBll();
      const body = (await req.json()) as { token?: string };
      const token = body.token?.toString().trim() ?? "";
      const userId = String(payload.userId ?? "").trim();

      if (!userId || !token) {
        response.isSuccess = false;
        response.message = "Invalid or expired verification code.";
        return NextResponse.json(response, { status: 400 });
      }

      response = await bll.ValidateAuthenticator(userId, token);
      if (response.isSuccess && response.body) {
        const user = response.body;
        const sessionPayload = {
          sub: user.email,
          roles: [user.roles],
          email: user.email,
        };

        const sessionToken = await new SignJWT(sessionPayload)
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime(`${EXPIRES_SECONDS}s`)
          .sign(secretKey);

        const res = NextResponse.json(response, { status: 200 });
        res.cookies.set(JWT_NAME, sessionToken, {
          httpOnly: true,
          secure: IS_PRODUCTION,
          sameSite: "lax",
          path: "/",
          maxAge: EXPIRES_SECONDS,
        });
        res.cookies.set(PREAUTH_JWT_NAME, "", {
          httpOnly: true,
          secure: IS_PRODUCTION,
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
        return res;
      }
    } catch (err) {
      response.isSuccess = false;
      response.message =
        "An unexpected error occurred while validating the verification code.";
      log.log(err as string, "error");
    }

    return NextResponse.json(response);
  },
);
