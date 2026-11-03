"use client";

import { AccountCreationsTab } from "@/features/account/components/account-creations-tab";
import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { fetchCreations, type SubmissionListItem } from "@/features/account/lib/submission-api";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export const CreationsView = () => {
  const t = useTranslations("accountPage");
  const [creations, setCreations] = useState<SubmissionListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchCreations()
      .then(setCreations)
      .catch(() => setFailed(true));
  }, []);

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("tab-creations")} description={t("creations-description")}>
      {creations ? (
        <AccountCreationsTab creations={creations} />
      ) : (
        <p className="text-sm text-muted-foreground">{failed ? t("action-error") : t("checking")}</p>
      )}
    </AccountPageFrame>
  );
};