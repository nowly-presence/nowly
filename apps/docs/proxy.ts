import { appProxy } from "@nowly/locales/proxy";

export default appProxy;

// See apps/web/proxy.ts for why this excludes by extension rather than "path
// contains a dot" - the latter also matches dotted dynamic segments (e.g. a
// changelog version like /changelog/2.1.2, reachable through the [...slug]
// catch-all), skipping the proxy and leaving the locale unresolved for those.
export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|mjs|json|md|txt|xml|webmanifest|woff|woff2|ttf)$).*)",
  ],
};
