"use client";

import { GitHubIcon } from "@/components/icons";
import { Card, CardTitle } from "@/components/ui/card";
import { buildPresenceUrl } from "@/lib/constants";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { AuthorItem } from "./author-item";

type Props = {
  platform: Presence;
};

export const DevelopmentCard: FC<Props> = ({ platform }): ReactElement => {
  const t = useTranslations("marketplace-detail");

  return (
    <Card size="sm">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="flex items-center gap-1.5 text-foreground normal-case tracking-normal">{t("development")}</CardTitle>
        
        <Link
          href={buildPresenceUrl(platform)}
          target="_blank"
          className="bg-background text-shadow-background hover:bg-foreground/5 inline-flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all"
        >
          <GitHubIcon className="w-4 h-4" />
          Source
        </Link>
      </div>

      <div>
        <AuthorItem
          contributor={platform.author}
          label={platform.contributors.length > 0 ? t("author-label") : undefined}
        />

        {platform.contributors.length > 0 && platform.contributors.map((contributor, index) => (
          <AuthorItem key={index} contributor={contributor} label={t("contributor-label")} />
        ))}
      </div>
    </Card>
  );
};