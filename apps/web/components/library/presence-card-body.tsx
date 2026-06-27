"use client";

import { ASSET_URL } from "@/lib/assets";
import { getLocalizedDescription } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";
import { IconDownload, IconUsers } from "@tabler/icons-react";
import type { FC } from "react";

type Props = {
  presence: Presence
  locale: string
};

export const PresenceCardBody: FC<Props> = ({ presence, locale }) => {
  const numberFormat = new Intl.NumberFormat(locale);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: `${presence.iconColor}20` }}
        >
          <img
            src={ASSET_URL(presence.slug, "icon")}
            alt={presence.name}
            className="w-8 h-8 object-contain"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              img.src = ASSET_URL(presence.slug, "logo");
              const parent = img.parentElement;
              if (parent) parent.style.backgroundColor = "transparent";
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate mb-1">{presence.name}</h3>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {getLocalizedDescription(presence, locale)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-dim-foreground">
        <span className="flex items-center gap-1.5">
          <IconDownload className="size-3.5" />
          {numberFormat.format(presence.totalInstalls)}
        </span>

        <span className="flex items-center gap-1.5">
          <IconUsers className="size-3.5" />
          {numberFormat.format(presence.activeUsers)}
        </span>
      </div>
    </div>
  );
};