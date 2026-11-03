"use client";

import type { AccountPresence } from "@/features/account/lib/account-api";
import { presenceLogoUrl, siteBaseUrl } from "@/lib/api-base";
import { Badge, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { useFormatter, useTranslations } from "next-intl";

export const AccountPresencesTab = ({ presences }: {
  presences: AccountPresence[];
}) => {
  const t = useTranslations("accountPage");
  const format = useFormatter();
  return (
    <Card className="max-w-xl">
      <CardContent>
        <CardTitle className="text-lg">{t("presences-title")}</CardTitle>
        <CardDescription className="mt-2">{t("presences-description")}</CardDescription>
        {presences.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("presences-empty")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {presences.map((presence) => (
              <li key={presence.slug}>
                <a
                  href={`${siteBaseUrl()}/library/${encodeURIComponent(presence.slug)}`}
                  className="flex items-center justify-between gap-4 py-3 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={presenceLogoUrl(presence.slug)} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg bg-muted object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{presence.slug}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("presence-added", { date: format.dateTime(new Date(presence.installedAt), { dateStyle: "medium" }) })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={presence.enabled ? "default" : "secondary"}>{presence.enabled ? t("presence-enabled") : t("presence-disabled")}</Badge>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};