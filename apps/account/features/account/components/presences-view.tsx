"use client";

import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { AccountPresencesTab } from "@/features/account/components/account-presences-tab";
import { fetchAccountCustomActivities, fetchAccountPresences, type AccountCustomActivity, type AccountPresence } from "@/features/account/lib/account-api";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export const PresencesView = () => {
  const t = useTranslations("accountPage");
  const [presences, setPresences] = useState<AccountPresence[] | null>(null);
  const [activities, setActivities] = useState<AccountCustomActivity[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchAccountPresences()
      .then(setPresences)
      .catch(() => setFailed(true));
    fetchAccountCustomActivities()
      .then(setActivities)
      .catch(() => setActivities([]));
  }, []);

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("tab-presences")} description={t("presences-description")}>
      {presences ? (
        <AccountPresencesTab presences={presences} activities={activities} />
      ) : (
        <p className="text-sm text-muted-foreground">{failed ? t("action-error") : t("checking")}</p>
      )}
    </AccountPageFrame>
  );
};