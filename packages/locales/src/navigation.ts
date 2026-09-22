import { createNavigation } from "next-intl/navigation";
import { appRouting } from "./routing";

export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(appRouting);
