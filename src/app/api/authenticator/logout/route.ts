import { NextResponse } from "next/server";

const JWT_NAME = "session";
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

  return res;
};
