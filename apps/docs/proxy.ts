import { appProxy } from "@nowly/locales/proxy";

export default appProxy;

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
