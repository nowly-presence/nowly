"use client";

import { Frame } from "@/features/shell/components/frame";
import { PageHeader } from "@/features/shell/components/page-header";
import { StaffAuditRows } from "@/features/staff/components/staff-audit-feed";
import { useAuditEvents } from "@/features/staff/lib/use-audit-events";
import { Button } from "@nowly/ui";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useState } from "react";

const PAGE_SIZE = 10;

export const StaffAudit = () => {
  const t = useTranslations("staff");
  const { events, done, failed, busy, loadMore } = useAuditEvents();
  const [page, setPage] = useState(0);
  const loaded = events?.length ?? 0;
  const pages = Math.max(1, Math.ceil(loaded / PAGE_SIZE));
  const hasNext = page < pages - 1 || !done;

  const onNext = (): void => {
    if (page < pages - 1) {
      setPage(page + 1);
      return;
    }

    void loadMore().then(() => setPage(page + 1));
  };

  return (
    <>
      <PageHeader title={t("audit-title")} description={t("audit-description")} />
      <Frame
        padded={false}
        title={t("audit-list-title")}
        description={t("audit-list-description")}
        footer={
          <>
            <span className="text-xs text-muted-foreground">
              {t("presences-page", {
                page: page + 1,
                pages: done ? pages : `${pages}+`
              })}
            </span>
            <div className="flex gap-1.5">
              <Button size="icon-sm" variant="outline" aria-label={t("presences-prev")} disabled={page === 0} onClick={() => setPage(page - 1)}>
                <RiArrowLeftSLine className="size-4" />
              </Button>
              <Button size="icon-sm" variant="outline" aria-label={t("presences-next")} disabled={busy || !hasNext} onClick={onNext}>
                <RiArrowRightSLine className="size-4" />
              </Button>
            </div>
          </>
        }
      >
        <StaffAuditRows events={events ? events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : null} failed={failed} />
      </Frame>
    </>
  );
};