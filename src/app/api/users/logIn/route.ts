import { User } from "@/app/models/User";
import MainBll from "../../logic/bll/mainBll";
import BaseResponse from "@/app/models/baseResponse";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const JWT_NAME = "session";
const JWT_SECRET = process.env.JWT_SECRET!;

const secretKey = new TextEncoder().encode(JWT_SECRET);

const EXPIRES_SECONDS = parseInt(process.env.EXPIRES_SECONDS as string); // 8 horas

export const POST = async (req: Request) => {
  let response: BaseResponse<User> = new BaseResponse<User>();
  try {
    const bll: MainBll = new MainBll();
    const { email, password } = await req.json();
    response = await bll.LogIn(email, password);

    if (response.isSuccess && response.body) {
      const user = response.body;

      // payload del token
      const payload = {
        sub: user.email,
        roles: [user.roles],
        email: user.email,
      };

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${EXPIRES_SECONDS}s`)
        .sign(secretKey);

      // respuesta + cookie
      const res = NextResponse.json(response, { status: 200 });
      res.cookies.set(JWT_NAME, token, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: EXPIRES_SECONDS,
      });
      return res;
    }
  } catch (err) {
    response.isSuccess = false;
    response.message = "Unexpected error";
  }

  return NextResponse.json(response);
};
