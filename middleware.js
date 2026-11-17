import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/session";

const PUBLIC_PAGES = ["/login", "/register"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/logout", "/api/auth/me", "/api/auth/register"];

const ADMIN_PAGES = ["/admin", "/dashboard", "/payments", "/parking/exit"];
const CUSTOMER_ONLY_PAGES = ["/feedback"];

const ALL = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const WRITES = ["POST", "PUT", "PATCH", "DELETE"];
const ADMIN_API = [
  ["/api/reports", ALL],
  ["/api/payments", ALL],
  ["/api/activity", ALL],
  ["/api/incidents", ALL],
  ["/api/health", ALL],
  ["/api/owners", ALL],
  ["/api/slots", WRITES],
  ["/api/rates", WRITES],
  ["/api/parking", ["PUT", "PATCH", "DELETE"]],
  ["/api/feedback", ["GET"]],
  ["/api/complaints", ["GET", "PUT", "PATCH", "DELETE"]],
  ["/api/notifications", ["POST"]],
];

const matches = (path, prefix) => path === prefix || path.startsWith(prefix + "/");

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (PUBLIC_PAGES.some((p) => matches(pathname, p)) || PUBLIC_API.includes(pathname)) {
    return NextResponse.next();
  }

  const session = await verifyToken(request.cookies.get(COOKIE_NAME)?.value);

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Login required" }, { status: 401 });
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session.role !== "admin") {
    const adminOnly = isApi
      ? ADMIN_API.some(([prefix, methods]) => matches(pathname, prefix) && methods.includes(request.method))
      : ADMIN_PAGES.some((p) => matches(pathname, p));

    if (adminOnly) {
      if (isApi) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else if (!isApi && CUSTOMER_ONLY_PAGES.some((p) => matches(pathname, p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
