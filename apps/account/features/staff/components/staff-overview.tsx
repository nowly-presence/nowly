"use client";

import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import { fetchReviewQueue, type QueueFilter, type ReviewQueue } from "@/features/account/lib/submission-api";
import { staffSubmissionHref } from "@/features/staff/lib/staff-nav";
import { PageHeader } from "@/features/shell/components/page-header";
import { Link } from "@/i18n/navigation";
import { Button, Card, CardContent } from "@nowly/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const KPIS = [
  { filter: "pending", key: "kpi-pending" },
  { filter: "changes_requested", key: "kpi-changes" },
  { filter: "in_progress", key: "kpi-progress" },
  { filter: "published", key: "kpi-published" }
] as const;

const FILTERS: readonly QueueFilter[] = ["all", "pending", "changes_requested", "published", "rejected"];
const LATEST_LIMIT = 8;

export const StaffOverview = () => {
  const t = useTranslations("staff");
  const account = useTranslations("accountPage");
  const format = useFormatter();
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [totals, setTotals] = useState<ReviewQueue["counts"] | null>(null);
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    fetchReviewQueue(filter)
      .then((value) => {
        setQueue(value);
        setTotals(value.counts);
      })
      .catch(() => setFailed(true));
  }, [filter]);

  const filterLabel = (value: QueueFilter): string => {
    if (value === "all") return account("queue-filter-all");

    return value === "pending" ? account("queue-filter-pending") : account(`status-${value}`);
  };

  return (
    <>
      <PageHeader title={t("overview-title")} description={t("overview-description")}>
        <Link href="/moderation/review" className="inline-flex h-8 items-center rounded-[10px] bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80">
          {t("open-queue")}
        </Link>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <Card key={kpi.filter}>
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t(kpi.key)}</span>
              <span className="text-3xl font-semibold tracking-tight text-foreground">{totals ? totals[kpi.filter] : "-"}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-medium text-foreground">{t("latest-title")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((value) => (
                <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} aria-pressed={filter === value} onClick={() => setFilter(value)}>
                  {filterLabel(value)}
                </Button>
              ))}
            </div>
          </div>
          {failed ? <p className="text-sm text-destructive">{t("error")}</p> : null}
          {!queue && !failed ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
          {queue && queue.items.length === 0 ? <p className="text-sm text-muted-foreground">{t("latest-empty")}</p> : null}
          {queue && queue.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-120 text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">{t("col-presence")}</th>
                    <th className="py-2 pr-4 font-medium">{t("col-author")}</th>
                    <th className="py-2 pr-4 font-medium">{t("col-status")}</th>
                    <th className="py-2 text-right font-medium">{t("col-updated")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queue.items.slice(0, LATEST_LIMIT).map((item) => (
                    <tr key={item.id} className="hover:bg-foreground/4">
                      <td className="py-2.5 pr-4">
                        <Link href={staffSubmissionHref(item.id)} className="font-medium text-foreground hover:underline">
                          {item.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{item.author?.name ?? "-"}</td>
                      <td className="py-2.5 pr-4">
                        <SubmissionStatusBadge status={item.status} />
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">{format.dateTime(new Date(item.updatedAt), { dateStyle: "medium" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
};
