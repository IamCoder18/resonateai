import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MOBILE_ORIGINS = new Set([
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
]);

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const isApi = req.nextUrl.pathname.startsWith("/api/");

  if (!isApi) return NextResponse.next();

  const res = NextResponse.next();

  if (origin && MOBILE_ORIGINS.has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
    res.headers.set("Access-Control-Max-Age", "86400");
  }

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
