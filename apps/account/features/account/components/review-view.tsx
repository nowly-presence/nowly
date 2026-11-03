"use client";

import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { AccountSubmissionRow } from "@/features/account/components/account-submission-row";
import { useSessionUser } from "@/features/account/components/session-provider";
import { fetchReviewQueue, type QueueItem } from "@/features/account/lib/submission-api";
import { Card, CardContent } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export const ReviewView = () => {
  const t = useTranslations("accountPage");
  const user = useSessionUser();
  const allowed = user.capabilities.includes("review");
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!allowed) return;

    fetchReviewQueue()
      .then(setQueue)
      .catch(() => setFailed(true));
  }, [allowed]);

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("queue-title")} description={t("queue-description")}>
      {!allowed ? <p className="text-sm text-destructive">{t("action-error")}</p> : null}
      {allowed && !queue ? <p className="text-sm text-muted-foreground">{failed ? t("action-error") : t("checking")}</p> : null}
      {queue ? (
        <Card className="max-w-xl">
          <CardContent>
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("queue-empty")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {queue.map((item) => (
                  <AccountSubmissionRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </AccountPageFrame>
  );
};