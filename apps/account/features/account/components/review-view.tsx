"use client";

import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { AccountSubmissionRow } from "@/features/account/components/account-submission-row";
import { useSessionUser } from "@/features/account/components/session-provider";
import { fetchReviewQueue, type QueueFilter, type ReviewQueue } from "@/features/account/lib/submission-api";
import { Button, Card, CardContent } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const FILTERS: readonly QueueFilter[] = ["pending", "in_progress", "changes_requested", "published", "rejected", "all"];

export const ReviewView = () => {
  const t = useTranslations("accountPage");
  const user = useSessionUser();
  const allowed = user.capabilities.includes("review");
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!allowed) return;

    setFailed(false);
    fetchReviewQueue(filter)
      .then(setQueue)
      .catch(() => setFailed(true));
  }, [allowed, filter]);

  const label = (value: QueueFilter): string => {
    if (value === "pending") return t("queue-filter-pending");

    return value === "all" ? t("queue-filter-all") : t(`status-${value}`);
  };

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("queue-title")} description={t("queue-description")}>
      {!allowed ? <p className="text-sm text-destructive">{t("action-error")}</p> : null}
      {allowed ? (
        <div className="flex max-w-3xl flex-wrap gap-2">
          {FILTERS.map((value) => (
            <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {label(value)}
              {queue ? <span className="ml-1.5 text-xs text-muted-foreground">{queue.counts[value]}</span> : null}
            </Button>
          ))}
        </div>
      ) : null}
      {allowed && !queue ? <p className="text-sm text-muted-foreground">{failed ? t("action-error") : t("checking")}</p> : null}
      {allowed && queue && failed ? <p className="text-sm text-destructive">{t("action-error")}</p> : null}
      {queue ? (
        <Card className="max-w-3xl">
          <CardContent>
            {queue.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{filter === "pending" ? t("queue-empty") : t("queue-empty-filtered")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {queue.items.map((item) => (
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
