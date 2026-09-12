import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_COOKIE, isValidSession } from "@/lib/auth";

const liveRoutes = [
  '/dashboard',
  '/settings'
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await isValidSession(request.cookies.get(DASHBOARD_COOKIE)?.value);

  if (!authed && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (authed && !liveRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude anything with a file extension (images, fonts, etc. served
  // straight out of /public) in addition to the API/Next.js internals —
  // otherwise a request like /CX-Email-Signature.png gets treated as a page
  // route and redirected instead of served as a static file.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
