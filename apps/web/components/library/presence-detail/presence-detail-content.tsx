"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import type { Presence } from "@/lib/data/presences";
import { useLocale, useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { DevelopmentCard } from "../development-card";
import { FeaturesCard } from "../features-card";
import { HeaderCard } from "../header-card";
import { InstallVersionsCard } from "../install-versions-card";
import { SettingsCard } from "../settings-card";
import { SupportedUrlsCard } from "../supported-urls-card";
type Props = {
  presence: Presence;
  isInstalled: boolean;
  extDetected: boolean;
  needsUpdate: boolean;
  loading: boolean;
  onInstall: () => void;
  onUninstall: () => void;
};

export const PresenceDetailContent: FC<Props> = ({
  presence,
  isInstalled,
  extDetected,
  needsUpdate,
  loading,
  onInstall,
  onUninstall,
}): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("marketplace-detail");

  return (
    <PageLayout>
      <div className="mx-auto max-w-300 px-6">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/library">
                {t("breadcrumb-home")}
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{presence.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <div className="space-y-4">
            <HeaderCard
              presence={presence}
              isInstalled={isInstalled}
              isExtDetected={extDetected}
              locale={locale}
              needsUpdate={needsUpdate}
              loading={loading}
              onInstall={onInstall}
              onUninstall={onUninstall}
            />

            <FeaturesCard platform={presence} locale={locale} />

            {presence.settings && Object.keys(presence.settings).length > 0 && (
              <SupportedUrlsCard urls={presence.supportedUrls} />
            )}
          </div>

          <div className="space-y-4">
            <DevelopmentCard platform={presence} />

            {presence.settings && Object.keys(presence.settings).length > 0
              ? <SettingsCard platform={presence} />
              : <SupportedUrlsCard urls={presence.supportedUrls} />}

            <InstallVersionsCard platform={presence} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};