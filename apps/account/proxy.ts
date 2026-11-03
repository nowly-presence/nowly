import { appProxy } from "@nowly/locales/proxy";

export default appProxy;

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|mjs|json|txt|xml|woff|woff2)$).*)"]
};