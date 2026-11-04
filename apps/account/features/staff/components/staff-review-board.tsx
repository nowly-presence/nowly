"use client";

import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import { fetchReviewQueue, type QueueItem, type SubmissionStatus } from "@/features/account/lib/submission-api";
import { StaffPeekPanel } from "@/features/staff/components/staff-peek-panel";
import { PageHeader } from "@/features/shell/components/page-header";
import { Button } from "@nowly/ui";
import { cn } from "@nowly/ui/utils";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const BOARD_STATUSES: readonly SubmissionStatus[] = ["submitted", "changes_requested", "approved", "in_progress", "published", "rejected"];
const DEFAULT_COLUMNS: readonly SubmissionStatus[] = ["submitted", "changes_requested", "approved"];

export const StaffReviewBoard = () => {
  const t = useTranslations("staff");
  const account = useTranslations("accountPage");
  const format = useFormatter();
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [columns, setColumns] = useState<readonly SubmissionStatus[]>(DEFAULT_COLUMNS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback((): void => {
    setFailed(false);
    fetchReviewQueue("all")
      .then((queue) => setItems(queue.items))
      .catch(() => setFailed(true));
  }, []);

  useEffect(load, [load]);

  const toggleColumn = (status: SubmissionStatus): void =>
    setColumns((current) => (current.includes(status) ? current.filter((entry) => entry !== status) : BOARD_STATUSES.filter((entry) => entry === status || current.includes(entry))));

  const selected = items?.find((item) => item.id === selectedId) ?? null;

  return (
    <>
      <PageHeader title={t("board-title")} description={t("board-description")} />
      <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label={t("board-columns")}>
        <span className="mr-1 text-xs text-muted-foreground">{t("board-columns")}</span>
        {BOARD_STATUSES.map((status) => (
          <Button key={status} size="sm" variant={columns.includes(status) ? "secondary" : "ghost"} aria-pressed={columns.includes(status)} onClick={() => toggleColumn(status)}>
            {account(`status-${status}`)}
            <span className="ml-1.5 text-xs text-muted-foreground">{items ? items.filter((item) => item.status === status).length : "-"}</span>
          </Button>
        ))}
      </div>
      {failed ? <p className="text-sm text-destructive">{t("error")}</p> : null}
      {!items && !failed ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
      {items ? (
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-2">
            {columns.length === 0 ? <p className="text-sm text-muted-foreground">{t("board-no-columns")}</p> : null}
            {columns.map((status) => {
              const cards = items.filter((item) => item.status === status);
              return (
                <section key={status} className="flex w-64 shrink-0 flex-col gap-2 rounded-[16px] bg-foreground/4 p-2.5 ring-1 ring-foreground/10">
                  <header className="flex items-center justify-between px-1">
                    <SubmissionStatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">{cards.length}</span>
                  </header>
                  {cards.length === 0 ? <p className="px-1 py-3 text-xs text-muted-foreground">{t("board-column-empty")}</p> : null}
                  {cards.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={item.id === selectedId}
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "flex flex-col gap-1 rounded-[10px] bg-background p-3 text-left ring-1 ring-foreground/10 outline-none transition-colors hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring",
                        item.id === selectedId && "ring-2 ring-primary"
                      )}
                    >
                      <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[item.kind === "update" ? account("kind-update") : account("kind-create"), item.author?.name].filter(Boolean).join(", ")}
                      </span>
                      <span className="text-xs text-muted-foreground">{format.dateTime(new Date(item.updatedAt), { dateStyle: "medium" })}</span>
                    </button>
                  ))}
                </section>
              );
            })}
          </div>
          <StaffPeekPanel item={selected} onChanged={load} />
        </div>
      ) : null}
    </>
  );
};
