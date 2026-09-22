export { appProxy as default } from "@nowly/locales/proxy";

export const config = {
  matcher: ["/((?!api|host|test|_next|_vercel|.*\\..*).*)"],
};
