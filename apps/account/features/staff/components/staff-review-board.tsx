"use client";

import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import { fetchReviewQueue, type QueueItem, type SubmissionStatus } from "@/features/account/lib/submission-api";
import { PageHeader } from "@/features/shell/components/page-header";
import { StaffPeekPanel } from "@/features/staff/components/staff-peek-panel";
import { StaffPresenceBanner } from "@/features/staff/components/staff-presence-banner";
import { Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuTrigger } from "@nowly/ui";
import { RiLayoutColumnLine } from "@nowly/ui/icons";
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

  const toggleColumn = (status: SubmissionStatus, checked: boolean): void =>
    setColumns(BOARD_STATUSES.filter((entry) => (entry === status ? checked : columns.includes(entry))));

  const selected = items?.find((item) => item.id === selectedId) ?? null;

  return (
    <>
      <PageHeader title={t("board-title")} description={t("board-description")}>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <RiLayoutColumnLine data-icon="inline-start" />
            {t("board-columns")}
            <span className="text-xs text-muted-foreground">{columns.length}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("board-columns")}</DropdownMenuLabel>
              {BOARD_STATUSES.map((status) => (
                <DropdownMenuCheckboxItem key={status} checked={columns.includes(status)} onCheckedChange={(checked) => toggleColumn(status, checked)}>
                  {account(`status-${status}`)}
                  <span className="ml-auto pr-4 text-xs text-muted-foreground">{items ? items.filter((item) => item.status === status).length : "-"}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>
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
                        "flex flex-col overflow-hidden rounded-[10px] bg-background text-left ring-1 ring-foreground/10 outline-none transition-colors hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring",
                        item.id === selectedId && "ring-2 ring-primary"
                      )}
                    >
                      <StaffPresenceBanner slug={item.slug} />
                      <span className="flex flex-col gap-0.5 px-3 pt-6 pb-3">
                        <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {[item.kind === "update" ? account("kind-update") : account("kind-create"), item.author?.name].filter(Boolean).join(", ")}
                        </span>
                        <span className="text-xs text-muted-foreground">{format.dateTime(new Date(item.updatedAt), { dateStyle: "medium" })}</span>
                      </span>
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