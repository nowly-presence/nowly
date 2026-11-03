"use client";

import { BrandLockup } from "@/features/shell/components/brand-lockup";
import { visibleModerationTabs, visibleTabs } from "@/features/shell/lib/account-tabs";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@nowly/ui/button-variants";
import { docsBaseUrl } from "@/lib/api-base";
import { Navbar } from "@nowly/ui/navbar";
import { useTranslations } from "next-intl";

export const AccountNavbar = ({ capabilities }: {
  capabilities: readonly string[];
}) => {
  const t = useTranslations("accountPage");
  const [moderationTab] = visibleModerationTabs(capabilities);
  return (
    <Navbar
      site="account"
      docsOrigin={docsBaseUrl()}
      brand={<BrandLockup width={148} height={60} className="h-full w-auto object-contain object-left" />}
      storeButton={
        moderationTab ? (
          <Link href={moderationTab.href} className={buttonVariants()}>
            {t("tab-moderation")}
          </Link>
        ) : null
      }
      accountLinks={visibleTabs(capabilities).map((tab) => ({
        href: tab.href,
        label: t(tab.key)
      }))}
    />
  );
};