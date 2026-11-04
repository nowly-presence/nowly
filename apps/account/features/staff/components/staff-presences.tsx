"use client";

import { PageHeader } from "@/features/shell/components/page-header";
import { deletePresence, fetchHiddenPresences, fetchPublicPresences, setPresenceHidden, type RepositoryRemoval, type StaffPresence } from "@/features/staff/lib/staff-api";
import { Badge, Button, Card, CardContent, Input } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export const StaffPresences = () => {
  const t = useTranslations("staff");
  const [visible, setVisible] = useState<StaffPresence[] | null>(null);
  const [hidden, setHidden] = useState<StaffPresence[]>([]);
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removal, setRemoval] = useState<RepositoryRemoval | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback((): void => {
    Promise.all([fetchPublicPresences(), fetchHiddenPresences()])
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

  const renderRow = (entry: StaffPresence, isHidden: boolean) => (
    <li key={entry.slug} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium text-foreground">{entry.name}</span>
        <span className="truncate text-xs text-muted-foreground">{entry.slug}</span>
        {isHidden ? <Badge variant="outline">{t("presences-hidden-badge")}</Badge> : null}
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
    </li>
  );

  return (
    <>
      <PageHeader title={t("presences-title")} description={t("presences-description")} />
      <div className="flex flex-col gap-4">
        <Input className="h-9 max-w-sm" value={query} placeholder={t("presences-search")} aria-label={t("presences-search")} onChange={(event) => setQuery(event.target.value)} />
        {failed ? <p className="text-sm text-destructive">{t("error")}</p> : null}
        {removal ? <p className="text-sm text-muted-foreground">{t(`presences-removed-${removal}`)}</p> : null}
        {!visible && !failed ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
        {hidden.filter(matches).length > 0 ? (
          <Card>
            <CardContent>
              <h2 className="mb-1 text-sm font-medium text-foreground">{t("presences-hidden-title")}</h2>
              <ul className="divide-y divide-border">{hidden.filter(matches).map((entry) => renderRow(entry, true))}</ul>
            </CardContent>
          </Card>
        ) : null}
        {visible ? (
          <Card>
            <CardContent>
              <h2 className="mb-1 text-sm font-medium text-foreground">{t("presences-visible-title")}</h2>
              <ul className="divide-y divide-border">{visible.filter(matches).map((entry) => renderRow(entry, false))}</ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
};
