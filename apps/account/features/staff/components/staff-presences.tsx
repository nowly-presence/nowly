"use client";

import { Frame } from "@/features/shell/components/frame";
import { PageHeader } from "@/features/shell/components/page-header";
import { deletePresence, fetchHiddenPresences, fetchPublicPresences, setPresenceHidden, type RepositoryRemoval, type StaffPresence } from "@/features/staff/lib/staff-api";
import { presenceLogoUrl } from "@/lib/api-base";
import { Badge, Button, Input } from "@nowly/ui";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

export const StaffPresences = () => {
  const t = useTranslations("staff");
  const [visible, setVisible] = useState<StaffPresence[] | null>(null);
  const [hidden, setHidden] = useState<StaffPresence[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removal, setRemoval] = useState<RepositoryRemoval | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback((): void => {
    Promise.all([
      fetchPublicPresences(),
      fetchHiddenPresences()
    ])
      .then(([shown, concealed]) => {
        setVisible(shown);
        setHidden(concealed);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(load, [load]);

  const run = (action: Promise<unknown>): void => {
    setBusy(true);
    setFailed(false);
    action
      .then(load)
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  const onDelete = (slug: string): void => {
    setConfirming(null);
    setRemoval(null);
    run(deletePresence(slug).then(setRemoval));
  };

  const matches = (entry: StaffPresence): boolean => `${entry.name} ${entry.slug}`.toLowerCase().includes(query.trim().toLowerCase());
  const all = [
    ...hidden.filter(matches).map((entry) => ({
      entry,
      isHidden: true
    })),
    ...(visible ?? []).filter(matches).map((entry) => ({
      entry,
      isHidden: false
    }))
  ];
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = all.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  return (
    <>
      <PageHeader title={t("presences-title")} description={t("presences-description")} />
      <div className="flex flex-col gap-4">
        <Input
          className="h-9 max-w-sm"
          value={query}
          placeholder={t("presences-search")}
          aria-label={t("presences-search")}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
        {failed ? <p className="text-sm text-destructive">{t("error")}</p> : null}
        {removal ? <p className="text-sm text-muted-foreground">{t(`presences-removed-${removal}`)}</p> : null}
        {!visible && !failed ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
        {visible ? (
          <Frame
            title={t("presences-list-title", { count: all.length })}
            description={t("presences-list-description")}
            padded={false}
            footer={
              <>
                <span className="text-xs text-muted-foreground">
                  {t("presences-page", {
                    page: current + 1,
                    pages
                  })}
                </span>
                <div className="flex gap-1.5">
                  <Button size="icon-sm" variant="outline" aria-label={t("presences-prev")} disabled={current === 0} onClick={() => setPage(current - 1)}>
                    <RiArrowLeftSLine className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={t("presences-next")}
                    disabled={current >= pages - 1}
                    onClick={() => setPage(current + 1)}
                  >
                    <RiArrowRightSLine className="size-4" />
                  </Button>
                </div>
              </>
            }
          >
            {rows.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{t("presences-empty")}</p> : null}
            {rows.map(({ entry, isHidden }) => (
              <div key={entry.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={presenceLogoUrl(entry.slug)}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 shrink-0 rounded-[10px] bg-foreground/6 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                      {entry.name}
                      {isHidden ? <Badge variant="outline">{t("presences-hidden-badge")}</Badge> : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{entry.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => run(setPresenceHidden(entry.slug, !isHidden))}>
                    {isHidden ? t("presences-show") : t("presences-hide")}
                  </Button>
                  {confirming === entry.slug ? (
                    <>
                      <Button size="sm" variant="destructive" disabled={busy} onClick={() => onDelete(entry.slug)}>
                        {t("presences-delete-confirm")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                        {t("peek-cancel")}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(entry.slug)}>
                      {t("presences-delete")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Frame>
        ) : null}
      </div>
    </>
  );
};