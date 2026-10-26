"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { siteConsent, trackProduct } from "@/lib/telemetry";

export const ProductTelemetry = () => {
  const pathname = usePathname();
  const sent = useRef<string | null>(null);
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (/^[a-z]{2}-[A-Z]{2}$/.test(parts[0] ?? "")) parts.shift();
    const page =
      parts.length === 0
        ? "home"
        : parts[0] === "library"
          ? parts.length === 1
            ? "library"
            : parts.length === 2 && parts[1] !== "authors"
              ? "presence"
              : null
          : null;
    const observe = () => {
      if (!page || siteConsent() !== true || sent.current === pathname) return;

      sent.current = pathname;
      trackProduct({
        name: "site_visit",
        source: "web",
        data: { page }
      });
    };
    observe();
    window.addEventListener("nowly:product-consent", observe);
    return () => window.removeEventListener("nowly:product-consent", observe);
  }, [pathname]);
  return null;
};