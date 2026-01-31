import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@/app/interfaces/Roles";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export type SessionPayload = {
  sub: string;
  roles?: Role[] | string[];
  companyId?: string;
  email?: string;
  name?: string;
  exp?: number;
};

type RouteContext = {
  params?: Record<string, string>;
};

type Handler = (
  req: NextRequest,
  ctx: RouteContext,
) => Promise<Response> | Response;

export function withRoles(allowed: Role[], handler: Handler) {
  return async (req: NextRequest, ctx: RouteContext = {}) => {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];

    try {
      const { payload } = await jwtVerify(token, secret);

      const roles = (payload.roles ?? []) as Role[];
      const ok = roles.some((r) => allowed.includes(r));
      if (!ok) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return handler(req, ctx);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
  };
}
