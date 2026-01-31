import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { Role, ROUTES_RULES } from "../interfaces/Roles";
import Cookies from "js-cookie";

const JWT_NAME = "session";

// En Edge, el secreto debe ser un Uint8Array
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

type JWTPayload = {
  roles?: Role[] | string[]; // por si lo guardaste como string[]
  // puedes agregar otros claims que emites (sub, companyId, etc.)
};

const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/pages")) return NextResponse.next();
  const token = req.cookies.get(JWT_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(
      new URL(`/?error=001&next=${pathname}`, req.url)
    );
  }

  try {
    // Verifica la firma y la expiración
    const { payload } = await jwtVerify<JWTPayload>(token, secret);

    // Normaliza roles a Role[]
    const roles = (payload.roles ?? []) as Role[];

    // Busca la regla que aplica a la ruta
    const rule = ROUTES_RULES.find((r) => r.pattern.test(pathname));
    if (!rule) return NextResponse.next(); // ruta pública/no mapeada

    const allowed = roles.some((r) => rule.allowed.includes(r));
    if (!allowed) {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL(`/?error=002&next=${pathname}`, req.url)
    );
  }
};

const getToken = async () => {
  return Cookies.get(JWT_NAME);
};

const removeToken = async () => {
  return Cookies.remove(JWT_NAME);
};

const config = {
  matcher: ["/pages/:path*"],
};

export { middleware, getToken, removeToken, config };
