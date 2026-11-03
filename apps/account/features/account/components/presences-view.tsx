"use client";

import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { AccountPresencesTab } from "@/features/account/components/account-presences-tab";
import { fetchAccountPresences, type AccountPresence } from "@/features/account/lib/account-api";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export const PresencesView = () => {
  const t = useTranslations("accountPage");
  const [presences, setPresences] = useState<AccountPresence[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchAccountPresences()
      .then(setPresences)
      .catch(() => setFailed(true));
  }, []);

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("tab-presences")} description={t("presences-description")}>
      {presences ? (
        <AccountPresencesTab presences={presences} />
      ) : (
        <p className="text-sm text-muted-foreground">{failed ? t("action-error") : t("checking")}</p>
      )}
    </AccountPageFrame>
  );
};