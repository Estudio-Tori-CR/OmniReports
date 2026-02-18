import { JWTPayload, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@/app/interfaces/Roles";
import Logs from "../utilities/Logs";

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
  params: Promise<Record<string, string>>;
};

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: RouteContext,
  payload: JWTPayload,
) => Promise<Response> | Response;

type RouteHandler = (
  req: NextRequest,
  ctx: RouteContext,
) => Promise<Response> | Response;

export function withRoles(
  allowed: Role[],
  handler: AuthenticatedHandler,
): RouteHandler {
  return async (req: NextRequest, ctx: RouteContext) => {
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

      const user = String(payload.email ?? payload.sub ?? "");
      const pathname = req.nextUrl.pathname;
      const source = `${req.method} ${pathname}`;
      let reportId = "";

      if (pathname === "/api/reports/execute") {
        try {
          const contentType = req.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const body = (await req.clone().json()) as { _id?: string };
            reportId = typeof body?._id === "string" ? body._id : "";
          } else {
            reportId = req.nextUrl.searchParams.get("reportId") ?? "";
          }
        } catch {
          reportId = req.nextUrl.searchParams.get("reportId") ?? "";
        }
      }

      try {
        const log = new Logs();
        await log.Binnacle(user, reportId, source);
      } catch {
        // ignore binnacle errors in auth middleware
      }

      return handler(req, ctx, payload);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
  };
}
