"use client";

import { usePathname } from "@/i18n/navigation";
import { RiArrowRightLine } from "@remixicon/react";
import { useTranslations } from "next-intl";

export const AnnouncementBar = () => {
  const pathname = usePathname();
  const t = useTranslations("custom-activity-section");

  if (pathname !== "/") return null;

  return (
    <a
      href="#custom-activity"
      className="group flex min-h-9 items-center justify-center gap-2 bg-primary px-5 py-2 text-center text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary-foreground sm:text-sm"
    >
      {t("announcement")}
      <RiArrowRightLine aria-hidden className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </a>
  );
};