"use client";

import { RiMenuLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/components/sidebar-context";

export const MobileSidebarToggle = () => {
  const t = useTranslations("docs");
  const { toggle } = useSidebar();

  return (
    <div className="lg:hidden mb-4">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <RiMenuLine className="size-[18px]" />
        <span>{t("menu")}</span>
      </button>
    </div>
  );
};