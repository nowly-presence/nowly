"use client";

import { BrandLockup } from "@/features/shell/components/brand-lockup";
import { visibleTabs } from "@/features/shell/lib/account-tabs";
import { docsBaseUrl } from "@/lib/api-base";
import { Navbar } from "@nowly/ui/navbar";
import { useTranslations } from "next-intl";

export const AccountNavbar = ({ capabilities }: {
  capabilities: readonly string[];
}) => {
  const t = useTranslations("accountPage");
  return (
    <Navbar
      site="account"
      docsOrigin={docsBaseUrl()}
      brand={<BrandLockup width={148} height={60} className="h-full w-auto object-contain object-left" />}
      storeButton={null}
      accountLinks={visibleTabs(capabilities).map((tab) => ({
        href: tab.href,
        label: t(tab.key)
      }))}
    />
  );
};