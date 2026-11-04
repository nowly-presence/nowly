"use client";

import { Frame } from "@/features/shell/components/frame";
import type { AccountCustomActivity, AccountPresence } from "@/features/account/lib/account-api";
import { presenceLogoUrl, siteBaseUrl } from "@/lib/api-base";
import { Badge } from "@nowly/ui";
import { useFormatter, useTranslations } from "next-intl";

export const AccountPresencesTab = ({ presences, activities }: {
  presences: AccountPresence[];
  activities: AccountCustomActivity[];
}) => {
  const t = useTranslations("accountPage");
  const format = useFormatter();
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Frame title={t("presences-title")} description={t("presences-description")} padded={false}>
          {presences.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("presences-empty")}</p>
          ) : (
            <ul className="divide-y divide-border px-4">
              {presences.map((presence) => (
                <li key={presence.slug}>
                  <a
                    href={`${siteBaseUrl()}/library/${encodeURIComponent(presence.slug)}`}
                    className="flex items-center justify-between gap-4 py-3 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={presenceLogoUrl(presence.slug)} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg bg-muted object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{presence.name}</p>
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
        </Frame>
      <Frame title={t("custom-activities-title")} description={t("custom-activities-description")} padded={false}>
          {activities.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("custom-activities-empty")}</p>
          ) : (
            <ul className="divide-y divide-border px-4">
              {activities.map((activity) => (
                <li key={activity.id} className="py-3">
                  <p className="truncate text-sm font-medium text-foreground">{activity.name}</p>
                  {activity.details || activity.state ? (
                    <p className="truncate text-xs text-muted-foreground">{[activity.details, activity.state].filter(Boolean).join(" / ")}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Frame>
    </div>
  );
};