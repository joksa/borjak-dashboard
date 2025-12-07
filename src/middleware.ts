import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const jwtPass = process.env.JWT_PASS;
  if (!jwtPass) {
    console.warn("Middleware: JWT_PASS is not defined, using default secret");
  }
  const secret = new TextEncoder().encode(jwtPass || "default_secret");

  // Handle root path: Redirect to dashboard if authenticated
  if (request.nextUrl.pathname === "/") {
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        // Token invalid, stay on login page
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Handle dashboard routes: Protect with auth
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      const userLevel = payload.level as string;

      const path = request.nextUrl.pathname;

      // Protect /dashboard/liflet/* - Only ADMIN
      if (path.startsWith("/dashboard/liflet") && userLevel !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Protect /dashboard/email - Only ADMIN
      if (path.startsWith("/dashboard/email") && userLevel !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
