"use client";

import { usePathname } from "@/i18n/navigation";
import { useEffect } from "react";

export const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
