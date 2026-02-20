import { NextResponse } from "next/server";
import { JWT_NAME, PREAUTH_JWT_NAME } from "../../middleware";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const POST = async () => {
  const res = NextResponse.json({ isSuccess: true });
  res.cookies.set(JWT_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(PREAUTH_JWT_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
};
