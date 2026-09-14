"use client";

import { PresenceCard } from "@/components/library/presence-card";
import { PresenceContributeLinks } from "@/components/library/presence-contribute-links";
import { ADSENSE_ENABLED } from "@/lib/constants";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { Fragment } from "react";
import { MarketplaceAdCard } from "./marketplace-ad-card";

type Props = {
  platforms: Presence[]
  locale: string
  onReset: () => void
};

const AD_FREQUENCY = 6;

export const MarketplaceGrid: FC<Props> = ({ platforms, locale, onReset }) => {
  const t = useTranslations("marketplace-page");

  if (platforms.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-2">{t("empty")}</p>
          <button onClick={onReset} className="text-accent hover:underline text-sm">
            {t("reset")}
          </button>
          <PresenceContributeLinks className="mx-auto mt-6 max-w-md text-sm text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {platforms.map((presence, index): ReactElement => {
        const shouldShowAd = ADSENSE_ENABLED && (index + 1) % AD_FREQUENCY === 0 && index < platforms.length - 1;

        return (
          <Fragment key={presence.id}>
            <PresenceCard presence={presence} locale={locale} />
            {shouldShowAd && <MarketplaceAdCard />}
          </Fragment>
        );
      })}
    </div>
  );
};