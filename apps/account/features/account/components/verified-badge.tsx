"use client";

import { RiVerifiedBadgeFill } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";

export const VerifiedBadge = () => {
  const t = useTranslations("accountPage");
  return <RiVerifiedBadgeFill className="size-4 shrink-0 text-accent" aria-label={t("verified-label")} role="img" />;
};