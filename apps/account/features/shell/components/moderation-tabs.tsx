"use client";

import { visibleModerationTabs } from "@/features/shell/lib/account-tabs";
import { PageContainer } from "@/features/shell/components/page-container";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@nowly/ui/utils";
import { useTranslations } from "next-intl";

export const ModerationTabs = ({ capabilities }: {
  capabilities: readonly string[];
}) => {
  const t = useTranslations("accountPage");
  const pathname = usePathname();
  return (
    <div className="border-b border-border pt-6">
      <PageContainer>
        <nav aria-label={t("tab-moderation")} className="flex items-center gap-1 pb-3">
          {visibleModerationTabs(capabilities).map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn("rounded-lg px-3 py-1.5 text-sm text-foreground", pathname.startsWith(tab.href) && "bg-foreground/8")}
            >
              {t(tab.key)}
            </Link>
          ))}
        </nav>
      </PageContainer>
    </div>
  );
};