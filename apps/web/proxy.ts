import { appProxy } from "@nowly/locales/proxy";

export default appProxy;

// Excludes real static assets by extension rather than "path contains a dot" -
// a blanket dot exclusion also matches dotted dynamic segments like a changelog
// version (/changelog/2.1.2), skipping the proxy and leaving the locale
// unresolved (getLocale() silently falls back to the default locale) for those.
export const config = {
  matcher: [
    "/((?!api|host|test|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|mjs|json|md|txt|xml|webmanifest|woff|woff2|ttf)$).*)",
  ],
};
