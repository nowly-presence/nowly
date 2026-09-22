import { appProxy } from "@nowly/locales/proxy";

export default appProxy;

export const config = {
  matcher: ["/((?!api|host|test|_next|_vercel|.*\\..*).*)"],
};
