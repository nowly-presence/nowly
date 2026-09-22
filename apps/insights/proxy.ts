import { API_TARGET_COOKIE, resolveApiTarget } from "@/features/api-target/lib/api-target";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!login|_next|favicon.ico|robots.txt).*)"],
};

const proxy = async (request: NextRequest) => {
  const target = resolveApiTarget(request.cookies.get(API_TARGET_COOKIE)?.value);
  const session = await getSession(request.headers.get("cookie") ?? undefined, target);

  if (!session || session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
};

export default proxy;
