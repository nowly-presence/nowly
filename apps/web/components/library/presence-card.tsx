"use client";

import type { Presence } from "@/lib/data/presences";
import { buildPresenceSeoPath } from "@/lib/seo-presence";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { PresenceCardBody } from "./presence-card-body";
import { PresenceCardThumbnail } from "./presence-card-thumbnail";

type Props = {
  presence: Presence
  locale: string
};

export const PresenceCard: FC<Props> = ({ presence, locale }): ReactElement => {
  const t = useTranslations("marketplace-page");
  const categoryLabel = t(`categories.${presence.category}`);

  return (
    <Link
      href={buildPresenceSeoPath(presence.slug)}
      prefetch={false}
      className={cn(
        "group bg-card border rounded-lg transition-colors hover:bg-card-hover overflow-hidden",
        presence.status === "soon"
          ? "border-dashed border-border opacity-70 hover:opacity-100"
          : "border-border hover:border-muted-foreground",
      )}
    >
      <PresenceCardThumbnail slug={presence.slug} categoryLabel={categoryLabel} />

      <div className="p-5">
        <PresenceCardBody presence={presence} locale={locale} />
      </div>
    </Link>
  );
};
