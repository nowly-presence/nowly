import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const docsOrigin = (): string =>
  (process.env.NEXT_PUBLIC_DOCS_BASE_URL ?? "https://docs.nowly.me").replace(/\/$/, "");

const isPrivacyDocsPath = (pathname: string): boolean =>
  pathname === "/docs/privacy" || /^\/docs(?:\/[^/]+)+\/privacy$/.test(pathname);

export const middleware = (request: NextRequest): NextResponse => {
  const { pathname, search } = request.nextUrl;

  if (isPrivacyDocsPath(pathname)) {
    return NextResponse.redirect(new URL(`/privacy${search}`, request.url), 308);
  }

  if (pathname === "/docs" || pathname.startsWith("/docs/")) {
    const docsPath = pathname === "/docs" ? "/" : pathname.slice("/docs".length);
    return NextResponse.redirect(`${docsOrigin()}${docsPath}${search}`, 308);
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/docs", "/docs/:path*"],
};
