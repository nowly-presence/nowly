import createMiddleware from "next-intl/middleware";
import { appRouting } from "./routing";

export const appProxy = createMiddleware(appRouting);
