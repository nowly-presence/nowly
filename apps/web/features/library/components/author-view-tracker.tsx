"use client";

import { trackPublicAnalytics } from "@/lib/analytics";
import { useLocale } from "next-intl";
import { useEffect } from "react";

export const AuthorViewTracker = () => {
  const locale = useLocale();

  useEffect(() => {
    trackPublicAnalytics("marketplace_author_page_view", { source: "web_library", payload: { locale } });
  }, [locale]);

  return null;
};
