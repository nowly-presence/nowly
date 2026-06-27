"use client";

import { IconMenu2 } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useSidebar } from "../ui/sidebar-context";

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
        <IconMenu2 size={18} />
        <span>{t("menu")}</span>
      </button>
    </div>
  );
};