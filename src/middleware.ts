import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role, ROUTES_RULES } from "./app/interfaces/Roles";

const JWT_NAME = "session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

type JWTPayload = {
  roles?: Role[] | string[];
};

export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/pages")) return NextResponse.next();
  if (pathname.startsWith("/pages/authenticator")) return NextResponse.next();

  const token = req.cookies.get(JWT_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL(`/?error=001&next=${pathname}`, req.url));
  }

  try {
    const { payload } = await jwtVerify<JWTPayload>(token, secret);
    const roles = (payload.roles ?? []) as Role[];

    const rule = ROUTES_RULES.find((r) => r.pattern.test(pathname));
    if (!rule) return NextResponse.next();

    const allowed = roles.some((r) => rule.allowed.includes(r));
    if (!allowed) {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL(`/?error=002&next=${pathname}`, req.url));
  }
};

export const config = {
  matcher: ["/pages/:path*"],
};
