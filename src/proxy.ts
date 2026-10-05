import { isValidSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const liveRoutes = [
  '/dashboard',
  '/devices',
  '/device-types',
  '/readers',
  '/settings',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthorized = await isValidSession(request);

  if (!isAuthorized && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (isAuthorized && !liveRoutes.includes(pathname)) {
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
