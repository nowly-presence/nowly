"use client";

import { AdSenseSlot } from "@/components/ads/adsense-slot";
import { ADSENSE_CLIENT_ID, ADSENSE_ENABLED, LIBRARY_AD_SLOT } from "@/lib/constants";
import { useAdStatus } from "@/providers/ad-status-provider";
import { IconSpeakerphone } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

export const MarketplaceAdCard: FC = (): ReactElement | null => {
  const t = useTranslations("ads");
  const { loading, hasAds, adFree } = useAdStatus();

  if (!ADSENSE_ENABLED || !ADSENSE_CLIENT_ID || !LIBRARY_AD_SLOT || loading || !hasAds || adFree) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="relative h-28 overflow-hidden bg-card-2">
        <AdSenseSlot
          slot={LIBRARY_AD_SLOT}
          className="h-full rounded-none border-0 bg-transparent"
          minHeight="112px"
          showLabel={false}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-accent/10 text-accent">
            <IconSpeakerphone className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate mb-1">{t("card-title")}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {t("card-description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{t("label")}</span>
        </div>
      </div>
    </div>
  );
};
